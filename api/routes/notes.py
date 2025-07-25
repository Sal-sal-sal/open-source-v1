#!/usr/bin/env python3
"""
API routes for creating notes from transcribed audio data stored in GCS.
"""

from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid
import io

from core.db import get_async_session, User, Document
from core.auth_utils import get_current_user
from core.gcs_storage import get_transcript_from_gcs, get_voice_message_from_gcs, gcs_manager, upload_voice_message_to_gcs
from assistance.audio_live.groq_whisper import transcribe_audio_groq_fast

router = APIRouter(prefix="/api/voice-notes", tags=["voice-notes"])

@router.post("/create-from-transcript/")
async def create_note_from_transcript(
    file_id: str = Form(...),
    voice_message_id: str = Form(None),
    note_title: str = Form(...),
    note_content: str = Form(...),
    tags: str = Form(""),
    session_cm: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user)
):
    """
    Create a note combining transcribed audio file and voice message.
    
    Args:
        file_id: ID of the transcribed audio file
        voice_message_id: ID of the voice message (optional)
        note_title: Title of the note
        note_content: Additional content for the note
        tags: Comma-separated tags
    """
    try:
        # Get transcript from GCS
        transcript_data = get_transcript_from_gcs(file_id, str(current_user.id))
        if not transcript_data:
            raise HTTPException(status_code=404, detail="Transcript not found in GCS")
        
        # Get voice message if provided
        voice_message_data = None
        if voice_message_id:
            voice_message_data = get_voice_message_from_gcs(voice_message_id, str(current_user.id))
            if not voice_message_data:
                raise HTTPException(status_code=404, detail="Voice message not found in GCS")
        
        # Build note content
        note_parts = []
        
        # Add transcript content
        transcript_text = transcript_data.get("transcript", "")
        if transcript_text:
            note_parts.append(f"## 📚 Аудио транскрипция\n\n{transcript_text}")
        
        # Add voice message if available
        if voice_message_data:
            voice_text = voice_message_data.get("transcript", "")
            if voice_text:
                note_parts.append(f"## 🎤 Голосовое сообщение\n\n{voice_text}")
        
        # Add user's additional content
        if note_content.strip():
            note_parts.append(f"## 📝 Дополнительные заметки\n\n{note_content}")
        
        # Combine all parts
        full_note_content = "\n\n".join(note_parts)
        
        # Create note object (you'll need to implement this based on your note model)
        note_data = {
            "id": str(uuid.uuid4()),
            "title": note_title,
            "content": full_note_content,
            "tags": [tag.strip() for tag in tags.split(",") if tag.strip()],
            "user_id": str(current_user.id),
            "created_at": datetime.utcnow().isoformat(),
            "sources": {
                "transcript_file_id": file_id,
                "voice_message_id": voice_message_id,
                "transcript_metadata": {
                    "original_filename": transcript_data.get("original_filename"),
                    "total_duration": transcript_data.get("total_duration"),
                    "service_used": transcript_data.get("service_used"),
                    "model": transcript_data.get("model"),
                    "language": transcript_data.get("language")
                }
            }
        }
        
        # Here you would save the note to your database
        # For now, we'll return the note data
        return {
            "status": "success",
            "note": note_data,
            "transcript_length": len(transcript_text),
            "voice_message_length": len(voice_message_data.get("transcript", "")) if voice_message_data else 0
        }
        
    except Exception as e:
        print(f"Error creating note from transcript: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create note: {str(e)}")

@router.post("/create-from-voice-message/")
async def create_note_from_voice_message(
    voice_file: UploadFile = File(...),
    note_title: str = Form(...),
    note_content: str = Form(""),
    tags: str = Form(""),
    session_cm: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user)
):
    """
    Create a note from a voice message with automatic transcription.
    
    Args:
        voice_file: Voice message audio file
        note_title: Title of the note
        note_content: Additional content for the note
        tags: Comma-separated tags
    """
    try:
        # Validate file type
        supported_extensions = (".mp3", ".wav", ".webm", ".m4a", ".ogg")
        file_extension = voice_file.filename.lower().split('.')[-1] if '.' in voice_file.filename else ''
        
        if f".{file_extension}" not in supported_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported audio file type: .{file_extension}. Supported types: {', '.join(supported_extensions)}"
            )
        
        # Generate unique message ID
        message_id = str(uuid.uuid4())
        
        # Transcribe voice message using optimized Groq
        print(f"Starting voice message transcription for: {voice_file.filename}")
        
        # Create a copy of the file for transcription
        file_content = await voice_file.read()
        file_obj = io.BytesIO(file_content)
        file_obj.seek(0)
        
        # Create UploadFile object for transcription
        upload_file = UploadFile(
            filename=voice_file.filename,
            file=file_obj
        )
        
        # Transcribe using fast Groq method
        transcription_result = await transcribe_audio_groq_fast(upload_file)
        
        if not transcription_result or not transcription_result.get("text"):
            raise HTTPException(status_code=500, detail="Failed to transcribe voice message")
        
        transcript_text = transcription_result.get("text", "")
        processing_time = transcription_result.get("processing_time", 0)
        
        print(f"Voice message transcribed in {processing_time:.2f} seconds")
        
        # Upload transcript to GCS
        gcs_url = upload_voice_message_to_gcs(
            message_id=message_id,
            transcript_text=transcript_text,
            user_id=str(current_user.id),
            chat_id=None  # No specific chat for notes
        )
        
        # Build note content
        note_parts = []
        
        # Add voice message transcription
        if transcript_text:
            note_parts.append(f"## 🎤 Голосовое сообщение\n\n{transcript_text}")
        
        # Add user's additional content
        if note_content.strip():
            note_parts.append(f"## 📝 Дополнительные заметки\n\n{note_content}")
        
        # Combine all parts
        full_note_content = "\n\n".join(note_parts)
        
        # Create note using AI instead of direct database insertion
        from assistance.notes_generator import generate_structured_note
        
        # Generate structured note using AI
        generated_note = generate_structured_note(full_note_content)
        
        # Create note in database using AI-generated content
        from core.db import Note
        
        note = Note(
            user_id=str(current_user.id),
            title=generated_note.title,
            meaning=generated_note.meaning,
            association=generated_note.association,
            personal_relevance=generated_note.personal_relevance,
            importance=generated_note.importance,
            implementation_plan=generated_note.implementation_plan,
            user_question=note_title,  # Use title as user question
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        async with session_cm as session:
            session.add(note)
            await session.commit()
            await session.refresh(note)
        
        # Create response data
        note_data = {
            "id": note.id,
            "title": note.title,
            "meaning": note.meaning,
            "association": note.association,
            "personal_relevance": note.personal_relevance,
            "importance": note.importance,
            "implementation_plan": note.implementation_plan,
            "user_question": note.user_question,
            "created_at": note.created_at.isoformat(),
            "sources": {
                "voice_message_id": message_id,
                "voice_message_metadata": {
                    "original_filename": voice_file.filename,
                    "processing_time": processing_time,
                    "service_used": transcription_result.get("service", "groq"),
                    "model": transcription_result.get("model", "whisper-large-v3-turbo"),
                    "gcs_url": gcs_url
                }
            }
        }
        # For now, we'll return the note data
        return {
            "status": "success",
            "note": note_data,
            "transcription": {
                "message_id": message_id,
                "text": transcript_text,
                "processing_time": processing_time,
                "gcs_url": gcs_url
            },
            "note_length": len(full_note_content)
        }
        
    except Exception as e:
        print(f"Error creating note from voice message: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create note: {str(e)}")

@router.post("/create-from-voice-and-transcript/")
async def create_note_from_voice_and_transcript(
    voice_file: UploadFile = File(...),
    transcript_file_id: str = Form(...),
    note_title: str = Form(...),
    note_content: str = Form(""),
    tags: str = Form(""),
    session_cm: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user)
):
    """
    Create a note combining a voice message with an existing transcript.
    
    Args:
        voice_file: Voice message audio file
        transcript_file_id: ID of the existing transcript
        note_title: Title of the note
        note_content: Additional content for the note
        tags: Comma-separated tags
    """
    try:
        # Get existing transcript from GCS
        print(f"Looking for transcript with file_id: {transcript_file_id} for user: {current_user.id}")
        transcript_data = get_transcript_from_gcs(transcript_file_id, str(current_user.id))
        if not transcript_data:
            print(f"Transcript not found in GCS for file_id: {transcript_file_id}")
            raise HTTPException(status_code=404, detail=f"Transcript not found in GCS for file_id: {transcript_file_id}. Please ensure the audio file was uploaded with auto-transcription enabled.")
        
        # Generate unique message ID for voice message
        message_id = str(uuid.uuid4())
        
        # Transcribe voice message
        print(f"Starting voice message transcription for: {voice_file.filename}")
        
        # Create a copy of the file for transcription
        file_content = await voice_file.read()
        file_obj = io.BytesIO(file_content)
        file_obj.seek(0)
        
        # Create UploadFile object for transcription
        upload_file = UploadFile(
            filename=voice_file.filename,
            file=file_obj
        )
        
        # Transcribe using fast Groq method
        transcription_result = await transcribe_audio_groq_fast(upload_file)
        
        if not transcription_result or not transcription_result.get("text"):
            raise HTTPException(status_code=500, detail="Failed to transcribe voice message")
        
        voice_text = transcription_result.get("text", "")
        processing_time = transcription_result.get("processing_time", 0)
        
        print(f"Voice message transcribed in {processing_time:.2f} seconds")
        
        # Upload voice message transcript to GCS
        gcs_url = upload_voice_message_to_gcs(
            message_id=message_id,
            transcript_text=voice_text,
            user_id=str(current_user.id),
            chat_id=None
        )
        
        # Build note content
        note_parts = []
        
        # Add transcript content
        transcript_text = transcript_data.get("transcript", "")
        if transcript_text:
            note_parts.append(f"## 📚 Аудио транскрипция\n\n{transcript_text}")
        
        # Add voice message
        if voice_text:
            note_parts.append(f"## 🎤 Голосовое сообщение\n\n{voice_text}")
        
        # Add user's additional content
        if note_content.strip():
            note_parts.append(f"## 📝 Дополнительные заметки\n\n{note_content}")
        
        # Combine all parts
        full_note_content = "\n\n".join(note_parts)
        
        # Create note using AI instead of direct database insertion
        from assistance.notes_generator import generate_structured_note
        
        # Generate structured note using AI
        generated_note = generate_structured_note(full_note_content)
        
        # Create note in database using AI-generated content
        from core.db import Note
        
        note = Note(
            user_id=str(current_user.id),
            title=generated_note.title,
            meaning=generated_note.meaning,
            association=generated_note.association,
            personal_relevance=generated_note.personal_relevance,
            importance=generated_note.importance,
            implementation_plan=generated_note.implementation_plan,
            user_question=note_title,  # Use title as user question
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        async with session_cm as session:
            session.add(note)
            await session.commit()
            await session.refresh(note)
        
        # Create response data
        note_data = {
            "id": note.id,
            "title": note.title,
            "meaning": note.meaning,
            "association": note.association,
            "personal_relevance": note.personal_relevance,
            "importance": note.importance,
            "implementation_plan": note.implementation_plan,
            "user_question": note.user_question,
            "created_at": note.created_at.isoformat(),
            "sources": {
                "transcript_file_id": transcript_file_id,
                "voice_message_id": message_id,
                "transcript_metadata": {
                    "original_filename": transcript_data.get("original_filename"),
                    "total_duration": transcript_data.get("total_duration"),
                    "service_used": transcript_data.get("service_used"),
                    "model": transcript_data.get("model")
                },
                "voice_message_metadata": {
                    "original_filename": voice_file.filename,
                    "processing_time": processing_time,
                    "service_used": transcription_result.get("service", "groq"),
                    "model": transcription_result.get("model", "whisper-large-v3-turbo"),
                    "gcs_url": gcs_url
                }
            }
        }
        
        return {
            "status": "success",
            "note": note_data,
            "transcription": {
                "transcript_length": len(transcript_text),
                "voice_message_length": len(voice_text),
                "voice_message_id": message_id,
                "voice_processing_time": processing_time,
                "voice_gcs_url": gcs_url
            },
            "note_length": len(full_note_content)
        }
        
    except Exception as e:
        print(f"Error creating note from voice and transcript: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create note: {str(e)}")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create note: {str(e)}")

@router.get("/transcripts/")
async def list_user_transcripts(
    session_cm: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user)
):
    """
    Get list of all user's transcribed audio files from GCS.
    """
    try:
        transcripts = gcs_manager.list_user_transcripts(str(current_user.id))
        return {
            "transcripts": transcripts,
            "count": len(transcripts)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list transcripts: {str(e)}")

@router.get("/transcript/{file_id}")
async def get_transcript_details(
    file_id: str,
    session_cm: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed information about a specific transcript.
    """
    try:
        transcript_data = get_transcript_from_gcs(file_id, str(current_user.id))
        if not transcript_data:
            raise HTTPException(status_code=404, detail="Transcript not found")
        
        # Return summary information (not the full transcript for performance)
        return {
            "file_id": file_id,
            "transcript_length": len(transcript_data.get("transcript", "")),
            "total_duration": transcript_data.get("total_duration", 0),
            "chunk_count": transcript_data.get("chunk_count", 0),
            "service_used": transcript_data.get("service_used", "unknown"),
            "model": transcript_data.get("model", "unknown"),
            "language": transcript_data.get("language", "auto"),
            "task": transcript_data.get("task", "transcribe"),
            "preview": transcript_data.get("transcript", "")[:500] + "..." if len(transcript_data.get("transcript", "")) > 500 else transcript_data.get("transcript", "")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get transcript: {str(e)}")

@router.post("/combine-sources/")
async def combine_transcription_sources(
    file_ids: List[str] = Form(...),
    voice_message_ids: List[str] = Form([]),
    title: str = Form(...),
    additional_content: str = Form(""),
    tags: str = Form(""),
    session_cm: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user)
):
    """
    Create a comprehensive note by combining multiple transcription sources.
    
    Args:
        file_ids: List of transcript file IDs
        voice_message_ids: List of voice message IDs
        title: Note title
        additional_content: Additional user content
        tags: Comma-separated tags
    """
    try:
        all_content = []
        sources_info = []
        
        # Process transcript files
        for file_id in file_ids:
            transcript_data = get_transcript_from_gcs(file_id, str(current_user.id))
            if transcript_data:
                transcript_text = transcript_data.get("transcript", "")
                if transcript_text:
                    all_content.append(f"## 📚 Транскрипция: {transcript_data.get('original_filename', file_id)}\n\n{transcript_text}")
                    sources_info.append({
                        "type": "transcript",
                        "file_id": file_id,
                        "filename": transcript_data.get("original_filename"),
                        "duration": transcript_data.get("total_duration"),
                        "length": len(transcript_text)
                    })
        
        # Process voice messages
        for message_id in voice_message_ids:
            voice_data = get_voice_message_from_gcs(message_id, str(current_user.id))
            if voice_data:
                voice_text = voice_data.get("transcript", "")
                if voice_text:
                    all_content.append(f"## 🎤 Голосовое сообщение: {message_id}\n\n{voice_text}")
                    sources_info.append({
                        "type": "voice_message",
                        "message_id": message_id,
                        "length": len(voice_text)
                    })
        
        # Add user's additional content
        if additional_content.strip():
            all_content.append(f"## 📝 Дополнительные заметки\n\n{additional_content}")
        
        # Combine all content
        full_content = "\n\n".join(all_content)
        
        # Create note
        note_data = {
            "id": str(uuid.uuid4()),
            "title": title,
            "content": full_content,
            "tags": [tag.strip() for tag in tags.split(",") if tag.strip()],
            "user_id": str(current_user.id),
            "created_at": datetime.utcnow().isoformat(),
            "sources": sources_info,
            "total_sources": len(sources_info)
        }
        
        return {
            "status": "success",
            "note": note_data,
            "total_content_length": len(full_content),
            "sources_count": len(sources_info)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to combine sources: {str(e)}") 