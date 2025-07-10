from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from sqlalchemy.orm import selectinload

from core.db import get_async_session, BookChat, BookChatMessage, Document
from core.models import (
    BookChatResponse,
    CreateBookChatRequest,
    BookChatListItem,
    ChatMessage,
)
from core.book_chat_models import BookChatMessageResponse
from assistance.ai_teacher import AITeacher
from core.auth_utils import get_current_user, User

router = APIRouter(prefix="/api/book-chats")

@router.post("", response_model=BookChatResponse)
async def create_book_chat(request: CreateBookChatRequest, current_user: User = Depends(get_current_user)):
    async with get_async_session() as session:
        statement = select(Document).where(Document.file_id == request.file_id)
        result = await session.execute(statement)
        doc = result.scalar_one_or_none()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        
        chat_name = request.name or f"Chat for {doc.filename}"

        book_chat = BookChat(file_id=request.file_id, name=chat_name, user_id=current_user.id)
        session.add(book_chat)
        await session.commit()
        await session.refresh(book_chat, ["messages"])
        return book_chat

@router.get("", response_model=List[BookChatListItem])
async def get_book_chats(current_user: User = Depends(get_current_user)):
    async with get_async_session() as session:
        result = await session.execute(select(BookChat).where(BookChat.user_id == current_user.id))
        chats = result.scalars().all()
        return chats

@router.get("/{chat_id}", response_model=BookChatResponse)
async def get_book_chat(chat_id: str, current_user: User = Depends(get_current_user)):
    async with get_async_session() as session:
        result = await session.execute(
            select(BookChat).where(BookChat.id == chat_id, BookChat.user_id == current_user.id).options(selectinload(BookChat.messages))
        )
        chat = result.scalar_one_or_none()
        if not chat:
            raise HTTPException(status_code=404, detail="Book chat not found")
        return chat

@router.post("/{chat_id}/messages", response_model=BookChatMessageResponse)
async def add_message_to_book_chat(
    chat_id: str,
    message: ChatMessage,
    current_user: User = Depends(get_current_user),
):
    async with get_async_session() as session:
        # Eagerly load document and messages
        result = await session.execute(
            select(BookChat).where(BookChat.id == chat_id, BookChat.user_id == current_user.id).options(selectinload(BookChat.document), selectinload(BookChat.messages))
        )
        chat = result.scalar_one_or_none()
        if not chat:
            raise HTTPException(status_code=404, detail="Book chat not found")

        # Save user message
        user_message = BookChatMessage(
            book_chat_id=chat_id, role="user", content=message.content
        )
        session.add(user_message)
        await session.commit()
        await session.refresh(user_message)

        # Determine page range that has been processed; fallback to entire doc
        start_page = chat.document.processed_from_page or 1
        end_page = chat.document.processed_to_page or (chat.document.total_pages or start_page)

        # Get AI response using embeddings
        ai_teacher = AITeacher()
        answer, sources, _ = await ai_teacher.answer_question(
            file_id=chat.file_id,
            question=message.content,
            from_page=start_page,
            to_page=end_page,
            db=session,
        )
        
        # Save AI message
        ai_message = BookChatMessage(
            book_chat_id=chat_id, role="assistant", content=answer
        )
        session.add(ai_message)
        await session.commit()
        await session.refresh(ai_message)
        
        def _to_message_dict(msg):
            d = msg.model_dump(include={"role", "content", "created_at"})
            d["timestamp"] = d.pop("created_at")
            return d

        user_msg_dict = _to_message_dict(user_message)
        ai_msg_dict = _to_message_dict(ai_message)
        
        return BookChatMessageResponse(
            user_message=user_msg_dict,
            ai_response=ai_msg_dict,
            sources=sources,
        )

@router.delete("/{chat_id}", status_code=204)
async def delete_book_chat(chat_id: str, current_user: User = Depends(get_current_user)):
    async with get_async_session() as session:
        chat = await session.execute(select(BookChat).where(BookChat.id == chat_id, BookChat.user_id == current_user.id))
        chat = chat.scalar_one_or_none()
        if chat:
            await session.delete(chat)
            await session.commit()
        return

@router.put("/{chat_id}/rename", response_model=BookChatListItem)
async def rename_book_chat(chat_id: str, new_name: str, current_user: User = Depends(get_current_user)):
    async with get_async_session() as session:
        chat = await session.execute(select(BookChat).where(BookChat.id == chat_id, BookChat.user_id == current_user.id))
        chat = chat.scalar_one_or_none()
        if not chat:
            raise HTTPException(status_code=404, detail="Book chat not found")
        chat.name = new_name
        session.add(chat)
        await session.commit()
        await session.refresh(chat)
        return chat 