import os
from fastapi import  File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import openai

load_dotenv()

client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))





async def transcribe_audio(file: UploadFile = File(...), start_time: float = None, end_time: float = None):
    # Check if file is a supported audio format
    supported_formats = [".mp3", ".wav", ".webm", ".m4a", ".ogg"]
    if not any(file.filename.lower().endswith(fmt) for fmt in supported_formats):
        raise HTTPException(status_code=400, detail=f"Неподдерживаемый формат файла. Поддерживаются: {', '.join(supported_formats)}")

    # Сохраняем файл во временное хранилище
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as buffer:
        buffer.write(await file.read())

    try:
        with open(temp_path, "rb") as audio_file:
            # Если указаны временные интервалы, используем их
            if start_time is not None and end_time is not None:
                transcript = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    timestamp_granularities=["word"],
                    response_format="verbose_json"
                )
                # Фильтруем слова по временным меткам
                filtered_words = []
                for word in transcript.words:
                    if start_time <= word.start <= end_time:
                        filtered_words.append(word.word)
                return " ".join(filtered_words)
            else:
                # Полная транскрибация без временных ограничений
                transcript = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file
                )
                return transcript.text
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при транскрибации: {str(e)}")
    finally:
        os.remove(temp_path)
