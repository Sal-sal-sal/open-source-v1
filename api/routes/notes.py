from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from core.db import get_async_session
from core.auth_utils import get_current_user, User
from core.notes_db import (
    create_note,
    get_notes_for_chat,
    update_note,
    delete_note,
    get_note_by_id,
)
from core.notes_models import NoteCreate, NoteUpdate, NoteRead

router = APIRouter(prefix="/api", tags=["notes"])


@router.post("/chats/{chat_id}/notes", response_model=NoteRead, status_code=status.HTTP_201_CREATED)
async def handle_create_note(
    chat_id: str,
    note: NoteCreate,
    current_user: User = Depends(get_current_user),
):
    """Create a new note for a chat."""
    async with get_async_session() as session:
        new_note = await create_note(session, note, chat_id, current_user.id)
        return new_note


@router.get("/chats/{chat_id}/notes", response_model=List[NoteRead])
async def handle_get_notes(
    chat_id: str,
    current_user: User = Depends(get_current_user),
):
    """Retrieve all notes for a specific chat."""
    async with get_async_session() as session:
        notes = await get_notes_for_chat(session, chat_id, current_user.id)
        return notes


@router.put("/notes/{note_id}", response_model=NoteRead)
async def handle_update_note(
    note_id: int,
    note: NoteUpdate,
    current_user: User = Depends(get_current_user),
):
    """Update a note."""
    async with get_async_session() as session:
        updated_note = await update_note(session, note_id, note, current_user.id)
        if not updated_note:
            raise HTTPException(status_code=404, detail="Note not found")
        return updated_note


@router.delete("/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def handle_delete_note(
    note_id: int,
    current_user: User = Depends(get_current_user),
):
    """Delete a note."""
    async with get_async_session() as session:
        success = await delete_note(session, note_id, current_user.id)
        if not success:
            raise HTTPException(status_code=404, detail="Note not found")
        return None 