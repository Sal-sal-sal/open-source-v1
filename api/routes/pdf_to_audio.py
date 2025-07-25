"""
API endpoints for simplified PDF to audio conversion.
Handles PDF upload, text extraction, TTS generation, and GCS upload.
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
import os
import tempfile
from typing import Optional
from assistance.pdf_to_audio import PDFToAudioConverter

router = APIRouter(prefix="/api/pdf-to-audio", tags=["PDF to Audio"])

@router.get("/voices")
async def get_voices():
    """Get available voices for TTS."""
    converter = PDFToAudioConverter()
    voices = converter.get_available_voices()
    return {"voices": voices}

@router.post("/convert")
async def convert_pdf_to_audio(
    file: UploadFile = File(...),
    voice: str = Form("en-US-Standard-A"),
    speed: float = Form(1.0)
):
    """Convert PDF file to audio."""
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    # Create temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
        content = await file.read()
        temp_file.write(content)
        temp_file_path = temp_file.name
    
    try:
        # Convert PDF to audio
        converter = PDFToAudioConverter()
        result = converter.convert_pdf_to_audio(
            pdf_path=temp_file_path,
            voice=voice,
            speed=speed
        )
        
        return JSONResponse(content=result)
    
    finally:
        # Clean up temporary file
        if os.path.exists(temp_file_path):
            os.unlink(temp_file_path)

@router.post("/convert-text")
async def convert_text_to_audio(
    text: str = Form(...),
    voice: str = Form("en-US-Standard-A"),
    speed: float = Form(1.0)
):
    """Convert text directly to audio (for library books)."""
    try:
        # Convert text to audio
        converter = PDFToAudioConverter()
        
        # Generate unique filename
        import uuid
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_filename = f"text_audio_{timestamp}_{uuid.uuid4().hex[:8]}"
        
        # Clean the text
        cleaned_text = converter.clean_text(text)
        
        # Generate speech
        audio_content = converter.text_to_speech(cleaned_text, voice, speed)
        
        # Upload to GCS
        gcs_filename = f"audio/{output_filename}.mp3"
        public_url = converter.upload_to_gcs(audio_content, gcs_filename)
        
        # Return results
        result = {
            "success": True,
            "public_url": public_url,
            "gcs_filename": gcs_filename,
            "text_length": len(cleaned_text),
            "audio_size_bytes": len(audio_content),
            "voice": voice,
            "voice_name": converter.voice_names.get(voice, "Unknown"),
            "speed": speed,
            "processing_time_seconds": 0.0,  # We don't track time for text conversion
            "chunks_processed": 1,
            "parallel_processing": False,
            "created_at": datetime.now().isoformat()
        }
        
        return JSONResponse(content=result)
        
    except Exception as e:
        return JSONResponse(
            content={
                "success": False,
                "error": str(e)
            },
            status_code=500
        ) 