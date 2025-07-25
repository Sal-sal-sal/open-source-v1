import os
import logging
from typing import Optional
from fastapi import UploadFile, HTTPException
from dotenv import load_dotenv

# Import transcription services
from .audio_whisper import transcribe_audio as transcribe_openai
from .groq_whisper import transcribe_audio_groq, is_groq_available

# Configure logging
logger = logging.getLogger(__name__)

load_dotenv()

class TranscriptionService:
    """Unified transcription service with support for multiple providers."""
    
    def __init__(self, preferred_service: str = "auto"):
        """
        Initialize transcription service.
        
        Args:
            preferred_service: "openai", "groq", or "auto" (default)
        """
        self.preferred_service = preferred_service.lower()
        self.openai_available = bool(os.getenv("OPENAI_API_KEY"))
        self.groq_available = is_groq_available()
        
        logger.info(f"Transcription service initialized - OpenAI: {self.openai_available}, Groq: {self.groq_available}")
        
        if not self.openai_available and not self.groq_available:
            logger.warning("No transcription services are configured!")
    
    async def transcribe(
        self, 
        file: UploadFile, 
        start_time: Optional[float] = None, 
        end_time: Optional[float] = None,
        force_service: Optional[str] = None
    ) -> str:
        """
        Transcribe audio using the preferred service with automatic fallback.
        
        Args:
            file: Audio file to transcribe
            start_time: Start time in seconds for time-based filtering
            end_time: End time in seconds for time-based filtering
            force_service: Force use of specific service ("openai" or "groq")
            
        Returns:
            Transcribed text
            
        Raises:
            HTTPException: If transcription fails for all available services
        """
        service_to_use = force_service.lower() if force_service else self.preferred_service
        
        # Determine which services to try and in what order
        if service_to_use == "openai":
            services_to_try = [("openai", "OpenAI Whisper")]
        elif service_to_use == "groq":
            services_to_try = [("groq", "Groq Whisper")]
        else:  # auto mode
            # Try preferred service first, then fallback
            if self.preferred_service == "groq" and self.groq_available:
                services_to_try = [("groq", "Groq Whisper"), ("openai", "OpenAI Whisper")]
            else:
                services_to_try = [("openai", "OpenAI Whisper"), ("groq", "Groq Whisper")]
        
        # Filter out unavailable services
        available_services = []
        for service, name in services_to_try:
            if service == "openai" and self.openai_available:
                available_services.append((service, name))
            elif service == "groq" and self.groq_available:
                available_services.append((service, name))
        
        if not available_services:
            raise HTTPException(
                status_code=500, 
                detail="No transcription services are available. Please configure OpenAI or Groq API keys."
            )
        
        # Try each service until one succeeds
        last_error = None
        for service, service_name in available_services:
            try:
                logger.info(f"Attempting transcription with {service_name}")
                
                if service == "openai":
                    result = await transcribe_openai(file, start_time, end_time)
                elif service == "groq":
                    result = await transcribe_audio_groq(file, start_time, end_time)
                else:
                    continue
                
                logger.info(f"Transcription successful with {service_name}")
                return result
                
            except Exception as e:
                last_error = e
                logger.warning(f"Transcription failed with {service_name}: {str(e)}")
                continue
        
        # If we get here, all services failed
        error_msg = f"All transcription services failed. Last error: {str(last_error)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)
    
    def get_available_services(self) -> dict:
        """Get information about available transcription services."""
        return {
            "openai": {
                "available": self.openai_available,
                "name": "OpenAI Whisper",
                "model": "whisper-1"
            },
            "groq": {
                "available": self.groq_available,
                "name": "Groq Whisper",
                "model": "whisper-large-v3-turbo"
            },
            "preferred": self.preferred_service
        }

# Global instance for easy access
transcription_service = TranscriptionService()

# Convenience function for backward compatibility
async def transcribe_audio(
    file: UploadFile, 
    start_time: Optional[float] = None, 
    end_time: Optional[float] = None,
    service: Optional[str] = None
) -> str:
    """
    Convenience function for transcription with automatic service selection.
    
    Args:
        file: Audio file to transcribe
        start_time: Start time in seconds for time-based filtering
        end_time: End time in seconds for time-based filtering
        service: Force specific service ("openai" or "groq")
        
    Returns:
        Transcribed text
    """
    return await transcription_service.transcribe(file, start_time, end_time, service) 