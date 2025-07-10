from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, and_
from datetime import datetime

from .db import Note
from .notes_models import NoteCreate, NoteUpdate


async def create_note(session: AsyncSession, note_in: NoteCreate, chat_id: str, user_id: str) -> Note:
    """Create a new note in the database."""
    note = Note(**note_in.dict(), chat_id=chat_id, user_id=user_id)
    session.add(note)
    await session.commit()
    await session.refresh(note)
    return note


async def get_notes_for_chat(session: AsyncSession, chat_id: str, user_id: str) -> List[Note]:
    """Retrieve all notes for a specific chat and user."""
    result = await session.execute(
        select(Note)
        .where(and_(Note.chat_id == chat_id, Note.user_id == user_id))
        .order_by(Note.created_at.desc())
    )
    return result.scalars().all()


async def get_note_by_id(session: AsyncSession, note_id: int, user_id: str) -> Optional[Note]:
    """Retrieve a single note by its ID."""
    result = await session.execute(
        select(Note).where(and_(Note.id == note_id, Note.user_id == user_id))
    )
    return result.scalar_one_or_none()


async def update_note(session: AsyncSession, note_id: int, note_in: NoteUpdate, user_id: str) -> Optional[Note]:
    """Update an existing note."""
    note = await get_note_by_id(session, note_id, user_id)
    if note:
        note.content = note_in.content
        note.updated_at = datetime.utcnow()
        session.add(note)
        await session.commit()
        await session.refresh(note)
    return note


async def delete_note(session: AsyncSession, note_id: int, user_id: str) -> bool:
    """Delete a note from the database."""
    note = await get_note_by_id(session, note_id, user_id)
    if note:
        await session.delete(note)
        await session.commit()
        return True
    return False 