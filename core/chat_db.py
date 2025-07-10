"""Chat-related database models and helper functions."""

import json
from typing import Any, Dict, List, Optional
import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from .db import Chat, Message


async def _ensure_chat(
    session: AsyncSession, chat_id: str, user_id: str
) -> Chat:
    result = await session.execute(
        select(Chat).where(Chat.id == chat_id, Chat.user_id == user_id)
    )
    chat = result.scalar_one_or_none()
    if chat is None:
        chat = Chat(id=chat_id, user_id=user_id, name=f"Chat {chat_id[:8]}")
        session.add(chat)
        await session.commit()
        await session.refresh(chat)
    return chat


async def add_message(
    session: AsyncSession,
    chat_id: str,
    user_id: str,
    role: str,
    content: str | None,
    tool_response: Any | None = None,
):
    """Persist message inside DB."""
    await _ensure_chat(session, chat_id, user_id)
    msg = Message(
        chat_id=chat_id,
        role=role,
        content=content,
        tool_response=tool_response,
    )
    session.add(msg)
    await session.commit()


async def get_history(
    session: AsyncSession, chat_id: str, user_id: str
) -> List[Dict[str, Any]]:
    """Return chat history formatted for OpenAI chat completions.

    Формирование словарей выполняется внутри активной сессии, чтобы избежать
    DetachedInstanceError после её закрытия.
    """
    result = await session.execute(
        select(Message).join(Chat).where(Message.chat_id == chat_id, Chat.user_id == user_id).order_by(Message.created_at.asc())
    )
    messages = result.scalars().all()

    formatted: List[Dict[str, Any]] = []
    for m in messages:
        entry: Dict[str, Any] = {"role": m.role}
        if m.role == "tool":
            try:
                payload = json.loads(m.content) if m.content else {}
            except json.JSONDecodeError:
                payload = {"content": m.content}
            entry |= payload
        else:
            entry["content"] = m.content or ""
        entry["id"] = m.id
        formatted.append(entry)

    # Return while session is still open, but data is detached-friendly (pure dict)
    return formatted


# Public helper to explicitly create a chat


async def create_chat(
    session: AsyncSession, user_id: str, chat_id: str | None = None
) -> str:
    """Create a new chat row and return its id.

    If `chat_id` is not provided, a UUID4 string will be generated.
    """
    new_id = chat_id or str(uuid.uuid4())
    print(f"Creating new chat with ID: {new_id} for user {user_id}")
    await _ensure_chat(session, new_id, user_id)
    return new_id


# ---------------- List chats helper ---------------- #


async def list_chats(session: AsyncSession, user_id: str) -> List[Dict[str, Any]]:
    """Return a list of all chats with their id."""
    result = await session.execute(select(Chat).where(Chat.user_id == user_id).order_by(Chat.created_at.desc()))
    chats = result.scalars().all()
    return [
        {
            "id": chat.id,
            "name": chat.name,
        }
        for chat in chats
    ]


async def delete_chat(session: AsyncSession, chat_id: str, user_id: str):
    """Delete a chat and its messages from the database."""
    result = await session.execute(select(Chat).where(Chat.id == chat_id, Chat.user_id == user_id))
    chat = result.scalar_one_or_none()
    if chat:
        await session.delete(chat)
        await session.commit()
        return True
    return False


async def update_chat_name(session: AsyncSession, chat_id: str, new_name: str, user_id: str):
    """Update the name of a chat."""
    result = await session.execute(select(Chat).where(Chat.id == chat_id, Chat.user_id == user_id))
    chat = result.scalar_one_or_none()
    if chat:
        chat.name = new_name
        session.add(chat)
        await session.commit()
        await session.refresh(chat)
        return chat
    return None 