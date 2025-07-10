from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
import json

from core.db import get_async_session, Document, BookChat
from core.book_chat_models import CreateBookChatRequest
from core.models import BookChatListItem
from core.auth_utils import get_current_user, User

router = APIRouter(prefix="/api/book-chats")

@router.post("", response_model=BookChatListItem)
async def create_book_chat(
    request: CreateBookChatRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Creates a new BookChat, extracts the full text from the document,
    and saves it to the database.
    """
    async with get_async_session() as session:
        doc = await session.get(Document, request.file_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

        book_text = ""
        if doc.full_text_path:
            # Note: This is a synchronous file read, which can block the event loop.
            # For a production app, consider using aiofiles.
            with open(doc.full_text_path, "r", encoding="utf-8") as f:
                book_text = "".join(json.load(f))
        
        chat_name = request.name or f"Chat with {doc.filename}"

        book_chat = BookChat(
            file_id=request.file_id,
            name=chat_name,
            user_id=current_user.id,
        )
        session.add(book_chat)
        await session.commit()
        await session.refresh(book_chat)

        # Log creation in terminal
        print(f"Created BookChat with ID: {book_chat.id} for document {doc.file_id}")

        return book_chat