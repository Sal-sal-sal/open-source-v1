from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
from sqlmodel.ext.asyncio.session import AsyncSession
import os
import uuid
import logging
from pathlib import Path

from core.auth_utils import get_current_user
from core.db import get_async_session, User, Document
from assistance.audio_live.transcription_service import transcribe_audio, transcription_service
from assistance.audio_live.distil_whisper import transcribe_audiobook, distil_whisper_transcriber
from core.gcs_storage import upload_transcript_to_gcs, upload_voice_message_to_gcs, get_transcript_from_gcs

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/audio", tags=["audio"])

UPLOAD_DIRECTORY = "uploads"
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)


@router.post("/load")
async def load_audio(
    file: UploadFile = File(...),
    auto_transcribe: bool = True,
    session_cm: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
):
    """
    Handles uploading an audio file, creating a Document entry, and optionally transcribing it.
    Returns the file_id of the created document and transcription info if requested.
    """
    # Log incoming request details
    print(f"Audio upload request - Filename: {file.filename}, Content-Type: {file.content_type}, Auto-transcribe: {auto_transcribe}")
    
    # Validate filename
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    # Check file type with more detailed error message
    supported_extensions = (".mp3", ".wav", ".webm", ".m4a", ".ogg")
    file_extension = os.path.splitext(file.filename.lower())[1]
    
    if file_extension not in supported_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported audio file type: {file_extension}. Supported types: {', '.join(supported_extensions)}"
        )
    
    # Check file size (max 25MB)
    max_size = 25 * 1024 * 1024  # 25MB
    file_content = await file.read()
    if len(file_content) > max_size:
        raise HTTPException(
            status_code=400, 
            detail=f"File too large: {len(file_content)} bytes. Maximum size: {max_size} bytes"
        )

    async with session_cm as session:
        try:
            file_id = str(uuid.uuid4())
            unique_filename = f"{file_id}{file_extension}"
            file_path = os.path.join(UPLOAD_DIRECTORY, unique_filename)

            # Ensure upload directory exists
            os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)

            # Save file (content already read above)
            with open(file_path, "wb") as buffer:
                buffer.write(file_content)

            print(f"File saved successfully - Path: {file_path}, Size: {len(file_content)} bytes")

            document = Document(
                file_id=file_id,
                filename=file.filename,
                file_path=file_path,
                file_type=file.content_type,
                user_id=current_user.id, # Link document to user
            )
            session.add(document)
            await session.commit()
            await session.refresh(document)

            print(f"Document created successfully - File ID: {document.file_id}")
            
            # Prepare response
            response = {"file_id": document.file_id}
            
            # Auto-transcribe if requested
            if auto_transcribe:
                try:
                    print(f"Starting auto-transcription for file: {file.filename}")
                    
                    # Create a new UploadFile object for transcription
                    from fastapi import UploadFile
                    import io
                    
                    # Create file-like object from content
                    file_obj = io.BytesIO(file_content)
                    file_obj.seek(0)
                    
                    # Create UploadFile object
                    upload_file = UploadFile(
                        filename=file.filename,
                        file=file_obj
                    )
                    
                    # Transcribe using optimized Distil-Whisper for speed
                    transcript_result = await transcribe_audiobook(
                        file=upload_file,
                        chunk_size=120,  # Увеличенный размер чанка для скорости
                        overlap=1,       # Уменьшенное перекрытие
                        language="auto",
                        task="transcribe",
                        service="groq",
                        fast_mode=True   # Включаем быстрый режим
                    )
                    
                    # Upload transcript to GCS
                    gcs_url = upload_transcript_to_gcs(
                        file_id=file_id,
                        transcript_data=transcript_result,
                        original_filename=file.filename,
                        user_id=str(current_user.id)
                    )
                    
                    # Add transcription info to response
                    response.update({
                        "transcription": {
                            "status": "completed",
                            "gcs_url": gcs_url,
                            "transcript_length": len(transcript_result.get("transcript", "")),
                            "total_duration": transcript_result.get("total_duration", 0),
                            "chunk_count": transcript_result.get("chunk_count", 0),
                            "service_used": transcript_result.get("service_used", "unknown"),
                            "model": transcript_result.get("model", "unknown")
                        }
                    })
                    
                    print(f"Transcription completed and uploaded to GCS: {gcs_url}")
                    
                except Exception as e:
                    print(f"Auto-transcription failed: {str(e)}")
                    response["transcription"] = {
                        "status": "failed",
                        "error": str(e)
                    }
            
            return response

        except Exception as e:
            await session.rollback()
            print(f"Error processing audio file: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")

@router.get("/transcription-services")
async def get_transcription_services():
    """
    Get information about available transcription services.
    """
    return transcription_service.get_available_services()

@router.post("/transcribe-audiobook/")
async def transcribe_audiobook_endpoint(
    file: UploadFile = File(...),
    chunk_size: int = 120,  # Увеличенный размер чанка для скорости
    overlap: int = 1,       # Уменьшенное перекрытие
    language: str = "auto",
    task: str = "transcribe",
    service: str = "groq",
    fast_mode: bool = True  # Включаем быстрый режим по умолчанию
):
    """
    Transcribe audiobook with optimized Distil-Whisper for maximum speed.
    
    Args:
        file: Audio file (mp3, wav, webm, m4a, ogg)
        chunk_size: Size of each chunk in seconds (default: 120, optimized for speed)
        overlap: Overlap between chunks in seconds (default: 1, minimized)
        language: Audio language ("auto" for auto-detection)
        fast_mode: Enable fast mode for short files (default: True)
        task: "transcribe" or "translate"
        service: "groq", "openai", or "local"
        
    Returns:
        Complete transcript with timestamps and metadata
    """
    # Check file type
    if not file.filename.lower().endswith(('.mp3', '.wav', '.webm', '.m4a', '.ogg')):
        raise HTTPException(
            status_code=400, 
            detail="Unsupported audio file type. Supported: mp3, wav, webm, m4a, ogg"
        )
    
    # Validate parameters
    if chunk_size < 10 or chunk_size > 300:
        raise HTTPException(status_code=400, detail="Chunk size must be between 10 and 300 seconds")
    
    if overlap < 0 or overlap >= chunk_size:
        raise HTTPException(status_code=400, detail="Overlap must be >= 0 and < chunk_size")
    
    if task not in ["transcribe", "translate"]:
        raise HTTPException(status_code=400, detail="Task must be 'transcribe' or 'translate'")
    
    if service not in ["groq", "openai", "local"]:
        raise HTTPException(status_code=400, detail="Service must be 'groq', 'openai', or 'local'")
    
    try:
        result = await transcribe_audiobook(
            file=file,
            chunk_size=chunk_size,
            overlap=overlap,
            language=language,
            task=task,
            service=service,
            fast_mode=fast_mode
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error in audiobook transcription: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

@router.get("/transcript/{file_id}")
async def get_audio_transcript(
    file_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get transcript for a specific audio file from GCS.
    
    Args:
        file_id: ID of the audio file
        current_user: Current authenticated user
        
    Returns:
        Transcript data from GCS
    """
    try:
        # Get transcript from GCS
        transcript_data = get_transcript_from_gcs(file_id, str(current_user.id))
        
        if not transcript_data:
            raise HTTPException(
                status_code=404, 
                detail=f"Transcript not found for file_id: {file_id}. Please ensure the audio file was uploaded with auto-transcription enabled."
            )
        
        return {
            "file_id": file_id,
            "transcript": transcript_data.get("transcript", ""),
            "total_duration": transcript_data.get("total_duration", 0),
            "chunk_count": transcript_data.get("chunk_count", 0),
            "service_used": transcript_data.get("service_used", "unknown"),
            "model": transcript_data.get("model", "unknown"),
            "language": transcript_data.get("language", "auto"),
            "task": transcript_data.get("task", "transcribe"),
            "original_filename": transcript_data.get("original_filename", "")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving transcript for file_id {file_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve transcript: {str(e)}")

@router.post("/transcript/")
async def transcript_audio(
    file: UploadFile = File(...),
    current_time: float = None,
    total_duration: float = None,
    service: str = None,
    save_to_gcs: bool = True,  # Changed default to True for voice messages
    message_id: str = None,
    chat_id: str = None,
    current_user: User = Depends(get_current_user)
):
    """
    Transcribe audio with time interval logic and GCS storage:
    - Standard: current_time ± 2 minutes (120 seconds)
    - Short file (≤ 4 minutes): process entire file
    - Boundary cases: adjust to file limits
    - Supports both mp3 and webm files for voice messages
    - Optional service parameter: "openai", "groq", or "auto" (default)
    - GCS storage enabled by default for voice messages
    """
    try:
        # Check file type
        if not file.filename.lower().endswith(('.mp3', '.wav', '.webm', '.m4a', '.ogg')):
            raise HTTPException(status_code=400, detail="Unsupported audio file type. Supported: mp3, wav, webm, m4a, ogg")
        
        start_time = None
        end_time = None
        
        if current_time is not None and total_duration is not None:
            # Calculate time interval
            if total_duration <= 240:  # ≤ 4 minutes
                # Process entire file
                start_time = 0
                end_time = total_duration
            else:
                # Standard interval: current_time ± 2 minutes
                start_time = max(0, current_time - 120)  # 2 minutes back, but not less than 0
                end_time = min(total_duration, current_time + 120)  # 2 minutes forward, but not more than total duration
        
        # Transcribe audio
        transcript_text = await transcribe_audio(file, start_time, end_time, service)
        
        if not transcript_text:
            raise HTTPException(status_code=500, detail="Transcription failed - no text was generated")
        
        # Prepare response
        response = {
            "transcript": transcript_text,
            "start_time": start_time,
            "end_time": end_time,
            "interval_duration": end_time - start_time if start_time is not None else None,
            "service_used": service or "auto"
        }
        
        # Save to GCS if requested (default for voice messages)
        if save_to_gcs and transcript_text:
            try:
                # Generate message_id if not provided
                if not message_id:
                    message_id = str(uuid.uuid4())
                
                # Upload to GCS
                gcs_url = upload_voice_message_to_gcs(
                    message_id=message_id,
                    transcript_text=transcript_text,
                    user_id=str(current_user.id),
                    chat_id=chat_id
                )
                
                response["gcs_storage"] = {
                    "status": "completed",
                    "message_id": message_id,
                    "gcs_url": gcs_url
                }
                
                logger.info(f"Voice message saved to GCS: {gcs_url}")
                
            except Exception as e:
                logger.error(f"Failed to save voice message to GCS: {str(e)}")
                response["gcs_storage"] = {
                    "status": "failed",
                    "error": str(e)
                }
                # Don't fail the entire request if GCS save fails
                # The transcript is still returned
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in audio transcription: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

@router.get("/")
async def list_audio_files():
    try:
        files = os.listdir(UPLOAD_DIRECTORY)
        audio_files = [f for f in files if f.lower().endswith(('.mp3', '.wav', '.ogg', '.m4a'))]
        return {"audio_files": audio_files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/file/{file_id}", response_class=FileResponse)
async def get_audio_file(
    file_id: str,
    session_cm: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves and serves an audio file by its file_id.
    """
    async with session_cm as session:
        doc = await session.get(Document, file_id)

        if not doc or doc.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Document not found or access denied")

        file_path = Path(doc.file_path)
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found on disk")

        return FileResponse(str(file_path), media_type=doc.file_type, filename=doc.filename) 