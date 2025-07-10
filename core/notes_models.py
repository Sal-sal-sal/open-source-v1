from pydantic import BaseModel, Field
from datetime import datetime
from typing import List

# --- Models for AI-Generated Structured Notes ---

class NoteExplanation(BaseModel):
    """An explanation of a concept."""
    meaning: str = Field(..., description="What this concept means in simple terms.")

class NoteAnalogy(BaseModel):
    """An analogy to help understand a concept."""
    analogy: str = Field(..., description="A real-world analogy for the concept.")

class NoteApplication(BaseModel):
    """A practical application of a concept."""
    application: str = Field(..., description="How this concept can be used in real life.")

class StructuredNote(BaseModel):
    """A structured note with explanation, analogy, and application."""
    explanation: NoteExplanation
    analogy: NoteAnalogy
    application: NoteApplication

# --- Models for User-Created Notes ---

class NoteBase(BaseModel):
    content: str

class NoteCreate(NoteBase):
    pass

class NoteUpdate(NoteBase):
    pass

class NoteRead(NoteBase):
    id: int
    chat_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 