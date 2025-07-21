from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from sqlmodel import Field, Relationship, SQLModel, Column, Integer, DateTime
from datetime import datetime, date

class FileUploadResponse(BaseModel):
    file_id: str
    filename: str
    size_bytes: int
    upload_time: datetime
    status: str = "uploaded"
    book_chat_id: Optional[str] = None
    total_pages: Optional[int] = None
    chunks_count: Optional[int] = None
    from_page: int | None = None
    to_page: int | None = None

class ChatMessage(BaseModel):
    role: str = Field(..., description="Role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")
    timestamp: datetime = Field(default_factory=datetime.now)

# Request to AI Teacher: question + file identifier
class ChatRequest(BaseModel):
    message: str = Field(..., description="User's question")
    file_id: str = Field(..., description="ID of the uploaded document")

class ChatResponse(BaseModel):
    answer: str = Field(..., description="AI-generated answer")
    sources: List[str] = Field(default_factory=list, description="Relevant text chunks used")
    confidence: float = Field(..., description="Confidence score of the answer")


class DocumentInfo(BaseModel):
    file_id: str
    filename: str
    upload_time: datetime
    status: str
    processing_status: str
    total_pages: Optional[int]
    total_chunks: Optional[int]
    file_type: str
    file_path: str
    from_page: int | None = None
    to_page: int | None = None

class Note(BaseModel):
    """Pydantic model for a structured note."""

    header: str
    text: str
    completed: bool = False

class CreateNoteRequest(BaseModel):
    """Request model for creating a note from source text."""
    source_text: str

class NoteItem(BaseModel):
    note: str = Field(..., description="A single note or to-do item")

class NotesOutput(BaseModel):
    """Structured output for generated notes."""
    title: str = Field(..., description="Title of the notes")
    notes: List[NoteItem] = Field(..., description="List of notes")

# --- Book Chat Models ---

class BookChatMessage(BaseModel):
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class BookChatResponse(BaseModel):
    id: str
    name: Optional[str]
    file_id: str
    messages: List[BookChatMessage]

    class Config:
        from_attributes = True
        
class CreateBookChatRequest(BaseModel):
    file_id: str
    name: Optional[str] = None

class BookChatListItem(BaseModel):
    id: str
    name: Optional[str]
    file_id: str

    class Config:
        from_attributes = True

class ChatSummary(BaseModel):
    id: str
    name: str

    class Config:
        from_attributes = True 

class UserInfo(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    hashed_password: str
    email: str | None = Field(default=None, unique=True)
    is_active: bool = Field(default=True)
    is_superuser: bool = Field(default=False)

    # Новые поля для профиля
    total_study_time: int = Field(default=0)  # Общее время обучения в секундах/минутах
    study_streak_days: int = Field(default=0) # Количество дней стрика
    last_study_date: date | None = Field(default=None) # Дата последнего обучения для расчета стрика


# Pydantic модель для ответа API профиля
class UserProfileResponse(SQLModel):
    username: str
    total_study_time: int
    study_streak_days: int
    # Можете добавить другие поля, если хотите, например:
    # email: str | None
    # last_study_date: date | None 