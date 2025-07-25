from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import List
from pydantic import BaseModel
from sqlalchemy import select
from datetime import datetime

from core.db import get_async_session, User, Note as NoteModel, Chat, BookChat, AudioChat
from core.auth_utils import get_current_user
from core.notes_models import StructuredNote
from assistance.notes_generator import generate_structured_note

router = APIRouter(prefix="/api/notes", tags=["notes"])

class NoteCreationRequest(BaseModel):
    source_text: str
    chat_id: str | None = None

class NoteUpdateRequest(BaseModel):
    implementation_plan: str

class NoteWithChatInfo(BaseModel):
    id: int
    title: str
    meaning: str
    association: str
    personal_relevance: str
    importance: str
    implementation_plan: str | None
    user_question: str | None  # For voice message notes
    created_at: datetime
    chat_name: str | None
    chat_type: str | None  # "chat" or "book_chat"

@router.get("/", response_model=List[NoteWithChatInfo])
async def get_user_notes(
    session_cm: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieves all notes for the current user with chat information.
    """
    async with session_cm as session:
        # Get all notes for the user
        stmt = select(NoteModel).where(NoteModel.user_id == current_user.id).order_by(NoteModel.created_at.desc())
        result = await session.execute(stmt)
        notes = result.scalars().all()
        
        notes_with_chat_info = []
        for note in notes:
            chat_name = None
            chat_type = None
            
            if note.chat_id:
                # Try to find in regular chats
                chat_stmt = select(Chat).where(Chat.id == note.chat_id)
                chat_result = await session.execute(chat_stmt)
                chat = chat_result.scalar_one_or_none()
                
                if chat:
                    chat_name = chat.name
                    chat_type = "chat"
                else:
                    # Try to find in book chats
                    book_chat_stmt = select(BookChat).where(BookChat.id == note.chat_id)
                    book_chat_result = await session.execute(book_chat_stmt)
                    book_chat = book_chat_result.scalar_one_or_none()
                    
                    if book_chat:
                        chat_name = book_chat.name
                        chat_type = "book_chat"
                    else:
                        # Try to find in audio chats
                        audio_chat_stmt = select(AudioChat).where(AudioChat.id == note.chat_id)
                        audio_chat_result = await session.execute(audio_chat_stmt)
                        audio_chat = audio_chat_result.scalar_one_or_none()
                        
                        if audio_chat:
                            chat_name = audio_chat.name
                            chat_type = "audio_chat"
            
            notes_with_chat_info.append(NoteWithChatInfo(
                id=note.id,
                title=note.title,
                meaning=note.meaning,
                association=note.association,
                personal_relevance=note.personal_relevance,
                importance=note.importance,
                implementation_plan=note.implementation_plan,
                user_question=note.user_question,
                created_at=note.created_at,
                chat_name=chat_name,
                chat_type=chat_type
            ))
        
        return notes_with_chat_info

@router.post("/", response_model=StructuredNote)
async def create_note_from_text(
    request: NoteCreationRequest,
    session_cm: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
):
    """
    Generates a structured note from source text and saves it to the database.
    """
    generated_note = generate_structured_note(request.source_text)
    
    db_note = NoteModel(
        user_id=current_user.id,
        chat_id=request.chat_id,
        **generated_note.dict()
    )
    async with session_cm as session:
        session.add(db_note)
        await session.commit()
        await session.refresh(db_note)
    
    return StructuredNote(**db_note.dict())


@router.get("/{note_id}", response_model=StructuredNote)
async def get_note(note_id: int, session_cm: AsyncSession = Depends(get_async_session)):
    """
    Retrieves a single structured note by its ID.
    """
    async with session_cm as session:
        note = await session.get(NoteModel, note_id)
        if not note:
            raise HTTPException(status_code=404, detail="Note not found")
        return StructuredNote(**note.dict())


@router.put("/{note_id}", response_model=StructuredNote)
async def update_note_implementation_plan(
    note_id: int,
    request: NoteUpdateRequest,
    session_cm: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
):
    """
    Updates the implementation plan of a specific note.
    """
    async with session_cm as session:
        note = await session.get(NoteModel, note_id)
        if not note or note.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Note not found or not owned by user")
            
        note.implementation_plan = request.implementation_plan
        await session.commit()
        await session.refresh(note)
        
        return StructuredNote(**note.dict())

@router.delete("/{note_id}")
async def delete_note(
    note_id: int,
    session_cm: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
):
    """
    Deletes a specific note.
    """
    async with session_cm as session:
        note = await session.get(NoteModel, note_id)
        if not note or note.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Note not found or not owned by user")
            
        await session.delete(note)
        await session.commit()
        
        return {"message": "Note deleted successfully"} 