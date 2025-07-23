from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class AudioChat(BaseModel):
    """
    Represents a chat session with a book, including the full text.
    """
    id: str
    name: Optional[str] # audio_name
    file_id: str
    created_at: datetime = Field(default_factory=datetime.now)

class CreateAudioChatRequest(BaseModel):
    """Request to create a new AudioChat instance."""
    file_id: str
    name: Optional[str] = None
