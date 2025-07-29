from typing import Optional, List, AsyncGenerator
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import Session

from assistance.llama4sc import response_to_user
from core.chat_db import (
    get_history,
    create_chat,
    list_chats,
    delete_chat,
    update_chat_name,
    add_message,
)
from core.auth_utils import get_current_user, User
from core.db import get_async_session
from assistance.title_generator import generate_chat_title_from_ai
from fastapi.responses import StreamingResponse


router = APIRouter(prefix="/api")


# Chat message from user (text only)
class ChatRequest(BaseModel):
    text: str = ""


class ChatResponse(BaseModel):
    response: str


class CreateChatResponse(BaseModel):
    chat_id: str


class ChatSummary(BaseModel):
    id: str
    name: str


class UpdateChatRequest(BaseModel):
    name: str


class GenerateChatTitleRequest(BaseModel):
    user_first_message: str


# General chat request (for AudioPage)
class GeneralChatRequest(BaseModel):
    message: str


class GeneralChatResponse(BaseModel):
    answer: str


async def stream_and_save_response(
    session: AsyncSession,
    chat_id: str,
    user_id: str,
    history: List[dict],
    user_message: str
) -> AsyncGenerator[str, None]:
    """Streams the response and saves the full message at the end."""
    full_response = ""
    async for chunk in response_to_user(
        session=session,
        chat_id=chat_id,
        user_id=user_id,
        history=history,
        user_message=user_message,
    ):
        full_response += chunk
        yield chunk
    
    # Save the full message after streaming is complete
    await add_message(session, chat_id, user_id, "assistant", full_response)


@router.post("/chat/general", response_model=GeneralChatResponse, tags=["chat"])
async def general_chat(
    body: GeneralChatRequest,
    current_user: User = Depends(get_current_user),
):
    """General chat endpoint for AudioPage without file context."""
    async with get_async_session() as session:
        # Create a temporary chat for this conversation
        chat_id = await create_chat(session, current_user.id)
        
        # Add user message
        await add_message(session, chat_id, current_user.id, "user", body.message)
        
        # Get response from AI
        history = await get_history(session, chat_id, current_user.id)
        
        # Generate response
        full_response = ""
        async for chunk in response_to_user(
            session=session,
            chat_id=chat_id,
            user_id=current_user.id,
            history=history,
            user_message=body.message,
        ):
            full_response += chunk
        
        # Save assistant response
        await add_message(session, chat_id, current_user.id, "assistant", full_response)
        
        return GeneralChatResponse(answer=full_response)


@router.post("/chat/{chat_id}/message", tags=["chat"])
async def post_message(
    chat_id: str,
    body: ChatRequest,
    current_user: User = Depends(get_current_user),
):
    """Send a user message and receive assistant response as a stream."""
    async with get_async_session() as session:
        await add_message(session, chat_id, current_user.id, "user", body.text)
        history = await get_history(session, chat_id, current_user.id)

        return StreamingResponse(
            stream_and_save_response(
                session, chat_id, current_user.id, history, body.text
            ),
            media_type="text/event-stream"
        )


@router.get("/chat/{chat_id}/messages", tags=["chat"])
async def get_messages(
    chat_id: str,
    current_user: User = Depends(get_current_user),
):
    """Retrieve full chat history for a chat_id."""
    async with get_async_session() as session:
        return await get_history(session, chat_id, current_user.id)


@router.post("/chat/new", response_model=CreateChatResponse, tags=["chat"])
async def new_chat(current_user: User = Depends(get_current_user)):
    """Create a new chat and return its identifier."""
    async with get_async_session() as session:
        chat_id = await create_chat(session, current_user.id)
        return CreateChatResponse(chat_id=chat_id)


@router.post("/chat/{chat_id}/generate-title", tags=["chat"])
async def generate_chat_title(
    chat_id: str,
    body: GenerateChatTitleRequest,
    current_user: User = Depends(get_current_user),
):
    """Generate a title for the chat based on the first user message and assistant response."""
    title = await generate_chat_title_from_ai(body.user_first_message)

    async with get_async_session() as session:
        chat = await update_chat_name(session, chat_id, title, current_user.id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        return {"id": chat.id, "name": chat.name}


@router.get("/chat", response_model=List[ChatSummary], tags=["chat"])
async def list_all_chats(current_user: User = Depends(get_current_user)):
    """Return list of existing chats."""
    async with get_async_session() as session:
        return await list_chats(session, current_user.id)


@router.put("/chat/{chat_id}/put", tags=["chat"])
async def update_chat(
    chat_id: str,
    request: UpdateChatRequest,
    current_user: User = Depends(get_current_user),
):
    """Update chat details, e.g., name."""
    async with get_async_session() as session:
        chat = await update_chat_name(session, chat_id, request.name, current_user.id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        return {"id": chat.id, "name": chat.name}


@router.delete("/chat/{chat_id}", status_code=204, tags=["chat"])
async def remove_chat(
    chat_id: str,
    current_user: User = Depends(get_current_user),
):
    """Delete a chat by its ID."""
    async with get_async_session() as session:
        was_deleted = await delete_chat(session, chat_id, current_user.id)
        if not was_deleted:
            raise HTTPException(status_code=404, detail="Chat not found")