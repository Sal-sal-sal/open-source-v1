import openai
import os
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")

app = FastAPI()


async def transcribe_audio(file: UploadFile = File(...)):
    if not file.filename.endswith(".mp3"):
        raise HTTPException(status_code=400, detail="Только .mp3 файлы поддерживаются")

    # Сохраняем временно файл
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as buffer:
        buffer.write(await file.read())

    try:
        with open(temp_path, "rb") as audio_file:
            transcript = openai.Audio.transcribe("whisper-1", audio_file)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при транскрибации: {str(e)}")
    finally:
        # Удаляем временный файл
        os.remove(temp_path)

    return JSONResponse(content={"text": transcript["text"]})
