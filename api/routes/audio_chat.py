from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import List
from sqlalchemy import select
import os

from core.db import get_async_session, User, AudioChat as AudioChatModel, Document
from core.auth_utils import get_current_user
from core.audio_notes import CreateAudioChatRequest, AudioChat as AudioChatResponse
from assistance.audio_live.transcription_service import transcribe_audio

router = APIRouter(prefix="/api/audio-chats", tags=["audio-chats"])

@router.get("/", response_model=List[AudioChatResponse])
async def get_user_audio_chats(
    session_cm: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieves all audio chats for the current user.
    """
    async with session_cm as session:
        stmt = select(AudioChatModel).where(AudioChatModel.user_id == current_user.id).order_by(AudioChatModel.created_at.desc())
        result = await session.execute(stmt)
        audio_chats = result.scalars().all()
        
        return audio_chats

@router.post("/", response_model=AudioChatResponse)
async def create_audio_chat(
    request: CreateAudioChatRequest,
    session_cm: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
):
    """
    Creates a new audio chat session for the user, linked to an existing document.
    """
    async with session_cm as session:
        doc = await session.get(Document, request.file_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Document with the given file_id not found.")

        audio_chat = AudioChatModel(
            user_id=current_user.id,
            file_id=request.file_id,
            name=request.name or doc.filename,
        )
        
        session.add(audio_chat)
        await session.commit()
        await session.refresh(audio_chat)
        
        return audio_chat

@router.get("/{chat_id}", response_model=AudioChatResponse)
async def get_audio_chat_details(
    chat_id: str,
    session_cm: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieves the details of a specific audio chat.
    """
    async with session_cm as session:
        audio_chat = await session.get(AudioChatModel, chat_id)
        
        if not audio_chat or audio_chat.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Audio chat not found or access denied.")
            
        return audio_chat 

@router.get("/{chat_id}/messages")
async def get_audio_chat_messages(
    chat_id: str,
    current_time: float = None,
    session_cm: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get messages from audio chat using transcript with time intervals.
    For audio chats, we use transcription with time-based filtering.
    """
    async with session_cm as session:
        audio_chat = await session.get(AudioChatModel, chat_id)
        
        if not audio_chat or audio_chat.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Audio chat not found or access denied.")
        
        # Get the associated document
        doc = await session.get(Document, audio_chat.file_id)
        if not doc:
            raise HTTPException(status_code=404, detail="Associated document not found.")
        
        # Check if file exists
        if not os.path.exists(doc.file_path):
            raise HTTPException(status_code=404, detail="Audio file not found.")
        
        try:
            # For now, we'll return a mock message structure
            # In a real implementation, you would use the transcript endpoint
            # with the audio file and current_time
            messages = [
                {
                    "role": "user",
                    "content": f"Audio transcript from {audio_chat.name}",
                    "created_at": audio_chat.created_at.isoformat()
                },
                {
                    "role": "assistant", 
                    "content": "This is a placeholder for audio chat messages. Use the /api/audio/transcript/ endpoint with the audio file and current_time to get actual transcriptions.",
                    "created_at": audio_chat.created_at.isoformat()
                }
            ]
            
            return messages
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to get audio chat messages: {str(e)}") 