from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import List, Dict, Any

from core.db import get_async_session, Chat, BookChat
from core.models import ChatSummary, BookChatListItem # Assuming these are appropriate for search results

router = APIRouter(prefix="/api")

@router.get("/search/chats", response_model=List[Dict[str, Any]])
async def search_chats(
    query: str = Query(..., min_length=1, description="Search query for chat names"),
    session: Session = Depends(get_async_session),
) -> List[Dict[str, Any]]:
    """
    Search for chats (both regular and book chats) by name.
    """
    results = []

    # Search regular chats
    chat_statement = select(Chat).where(Chat.name.ilike(f"%{query}%"))
    chat_results = await session.execute(chat_statement)
    for chat in chat_results.scalars().all():
        results.append({"id": chat.id, "name": chat.name, "type": "chat"})

    # Search book chats
    book_chat_statement = select(BookChat).where(BookChat.name.ilike(f"%{query}%"))
    book_chat_results = await session.execute(book_chat_statement)
    for book_chat in book_chat_results.scalars().all():
        results.append({"id": book_chat.id, "name": book_chat.name, "type": "book_chat"})
    
    return results 