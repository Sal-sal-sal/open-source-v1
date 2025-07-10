from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class BookChatMessage(BaseModel):
    """A message in a BookChat session."""
    role: str = Field(..., description="Role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")
    timestamp: datetime = Field(default_factory=datetime.now)

class BookChat(BaseModel):
    """
    Represents a chat session with a book, including the full text.
    """
    id: str
    name: Optional[str]
    book_text: str
    messages: List[BookChatMessage] = []
    created_at: datetime = Field(default_factory=datetime.now)

class CreateBookChatRequest(BaseModel):
    """Request to create a new BookChat instance."""
    file_id: str
    name: Optional[str] = None 

class BookChatMessageResponse(BaseModel):
    """Response model for a new message in a book chat."""
    user_message: BookChatMessage
    ai_response: BookChatMessage
    sources: List[str] = [] 