import os
import requests
from fastapi import File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import logging
import time

# Configure logging
logger = logging.getLogger(__name__)

load_dotenv()

GROQ_API_URL = "https://api.groq.com/openai/v1/audio/transcriptions"
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    logger.warning("GROQ_API_KEY not found in environment variables. Groq transcription will be disabled.")

async def transcribe_audio_groq(file: UploadFile = File(...), start_time: float = None, end_time: float = None):
    """
    Transcribe audio using Groq API with OpenAI-compatible endpoint.
    Optimized for speed and performance.
    
    Args:
        file: Audio file to transcribe
        start_time: Start time in seconds for time-based filtering
        end_time: End time in seconds for time-based filtering
        
    Returns:
        Transcribed text or filtered text based on time range
    """
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="Groq API key not configured")
    
    # Check if file is a supported audio format
    supported_formats = [".mp3", ".wav", ".webm", ".m4a", ".ogg"]
    if not any(file.filename.lower().endswith(fmt) for fmt in supported_formats):
        raise HTTPException(status_code=400, detail=f"Unsupported file format. Supported: {', '.join(supported_formats)}")

    start_time_total = time.time()
    logger.info(f"Starting Groq transcription for file: {file.filename}")

    # Save file to temporary storage
    temp_path = f"temp_groq_{file.filename}"
    with open(temp_path, "wb") as buffer:
        buffer.write(await file.read())

    try:
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}"
        }
        
        with open(temp_path, "rb") as audio_file:
            files = {
                "file": audio_file
            }
            
            # Optimized parameters for speed
            data = {
                "model": "whisper-large-v3-turbo",
                "response_format": "json",  # Faster than verbose_json
                "prompt": "This is a transcription of audio content."  # Improves quality
            }
            
            # Only use verbose format if time filtering is needed
            if start_time is not None and end_time is not None:
                data.update({
                    "response_format": "verbose_json",
                    "timestamp_granularities": ["word"]
                })
            
            logger.info(f"Sending request to Groq API...")
            response = requests.post(GROQ_API_URL, headers=headers, files=files, data=data)

        if response.status_code == 200:
            result = response.json()
            
            # Handle time-based filtering
            if start_time is not None and end_time is not None and "words" in result:
                # Filter words by timestamp
                filtered_words = []
                for word in result["words"]:
                    if start_time <= word["start"] <= end_time:
                        filtered_words.append(word["word"])
                transcript_text = " ".join(filtered_words)
            else:
                # Return full transcription
                transcript_text = result.get("text", "")
            
            total_time = time.time() - start_time_total
            logger.info(f"Groq transcription completed in {total_time:.2f} seconds")
            
            return transcript_text
        else:
            logger.error(f"Groq API error: {response.status_code} - {response.text}")
            raise HTTPException(status_code=500, detail=f"Groq transcription failed: {response.status_code}")
            
    except Exception as e:
        logger.error(f"Error in Groq transcription: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error during transcription: {str(e)}")
    finally:
        # Clean up temporary file
        if os.path.exists(temp_path):
            os.remove(temp_path)

async def transcribe_audio_groq_fast(file: UploadFile = File(...)):
    """
    Fast transcription using Groq API - optimized for maximum speed.
    Use this for short audio files where speed is critical.
    
    Args:
        file: Audio file to transcribe
        
    Returns:
        Transcribed text
    """
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="Groq API key not configured")
    
    start_time = time.time()
    logger.info(f"Starting fast Groq transcription for file: {file.filename}")

    # Save file to temporary storage
    temp_path = f"temp_groq_fast_{file.filename}"
    with open(temp_path, "wb") as buffer:
        buffer.write(await file.read())

    try:
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}"
        }
        
        with open(temp_path, "rb") as audio_file:
            files = {"file": audio_file}
            
            # Maximum speed configuration
            data = {
                "model": "whisper-large-v3-turbo",
                "response_format": "json",
                "prompt": "Transcribe this audio content."
            }
            
            logger.info(f"Sending fast request to Groq API...")
            response = requests.post(GROQ_API_URL, headers=headers, files=files, data=data)

        if response.status_code == 200:
            result = response.json()
            transcript_text = result.get("text", "")
            
            total_time = time.time() - start_time
            logger.info(f"Fast Groq transcription completed in {total_time:.2f} seconds")
            
            return {
                "text": transcript_text,
                "processing_time": total_time,
                "service": "groq",
                "model": "whisper-large-v3-turbo"
            }
        else:
            logger.error(f"Groq API error: {response.status_code} - {response.text}")
            raise HTTPException(status_code=500, detail=f"Groq transcription failed: {response.status_code}")
            
    except Exception as e:
        logger.error(f"Error in fast Groq transcription: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error during transcription: {str(e)}")
    finally:
        # Clean up temporary file
        if os.path.exists(temp_path):
            os.remove(temp_path)

def is_groq_available():
    """Check if Groq API is available and configured."""
    return bool(GROQ_API_KEY) 