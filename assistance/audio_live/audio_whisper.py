import os
from fastapi import  File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import openai

load_dotenv()

client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))





async def transcribe_audio(file: UploadFile = File(...)):
    if not file.filename.endswith(".mp3"):
        raise HTTPException(status_code=400, detail="Только .mp3 файлы поддерживаются")

    # Сохраняем файл во временное хранилище
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as buffer:
        buffer.write(await file.read())

    try:
        with open(temp_path, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при транскрибации: {str(e)}")
    finally:
        os.remove(temp_path)

    return transcript.text
