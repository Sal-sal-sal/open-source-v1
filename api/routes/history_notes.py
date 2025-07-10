from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from typing import List

from core.db import get_async_session, Chat
from core.notes_models import StructuredNote
from assistance.history_notes_generator import generate_structured_notes

router = APIRouter(prefix="/api")

@router.post("/chat/{chat_id}/structured-notes", response_model=StructuredNote)
async def create_structured_notes_from_chat(
    chat_id: str,
):
    """
    Generate structured notes from a chat's message history.
    """
    async with get_async_session() as session:
        chat = await session.get(Chat, chat_id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")

        history = [{"role": msg.role, "content": msg.content} for msg in chat.messages]
        if not history:
            raise HTTPException(status_code=400, detail="Chat has no messages to process")

        try:
            structured_notes = generate_structured_notes(history)
            return structured_notes
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to generate notes: {e}") 