from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
from sqlmodel.ext.asyncio.session import AsyncSession
import os
import uuid
from pathlib import Path

from core.auth_utils import get_current_user
from core.db import get_async_session, User, Document
from assistance.audio_live.audio_whisper import transcribe_audio

router = APIRouter(prefix="/api/audio", tags=["audio"])

UPLOAD_DIRECTORY = "uploads"
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)


@router.post("/load")
async def load_audio(
    file: UploadFile = File(...),
    session_cm: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
):
    """
    Handles uploading an audio file and creating a Document entry.
    Returns the file_id of the created document.
    """
    if not file.filename.endswith((".mp3", ".wav", ".m4a", ".ogg")):
        raise HTTPException(status_code=400, detail="Unsupported audio file type.")

    async with session_cm as session:
        try:
            file_id = str(uuid.uuid4())
            file_extension = os.path.splitext(file.filename)[1]
            unique_filename = f"{file_id}{file_extension}"
            file_path = os.path.join(UPLOAD_DIRECTORY, unique_filename)

            with open(file_path, "wb") as buffer:
                buffer.write(await file.read())

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

            return {"file_id": document.file_id}

        except Exception as e:
            await session.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to process file: {e}")

@router.post("/transcript/")
async def transcript_audio(file: UploadFile = File(...)):
    try:
        transcript_text = await transcribe_audio(file)
        return {"transcript": transcript_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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