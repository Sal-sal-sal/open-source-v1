from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from assistance.audio_live.audio_whisper import transcribe_audio  # Импортируем существующую функцию
import os

router = APIRouter(prefix="/api/audio", tags=["audio"])

@router.post("/load")
async def load_audio(file: UploadFile = File(...)):
    try:
        # Сохраняем файл временно
        file_path = f"uploads/{file.filename}"
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())
        return {"file_path": file_path, "message": "Audio loaded successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/transcript/")
async def transcript_audio(file: UploadFile = File(...)):
    try:
        transcript = await transcribe_audio(file)
        return JSONResponse(content={"transcript": transcript})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/file/{filename}", response_class=FileResponse)
async def get_audio_file(filename: str):
    file_path = f"uploads/{filename}"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path, media_type="audio/mpeg") 