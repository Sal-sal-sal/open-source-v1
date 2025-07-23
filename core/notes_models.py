from pydantic import BaseModel, Field
from typing import List, Optional

class StructuredNote(BaseModel):
    """A structured note with specific fields for learning and implementation."""
    title: str = Field(..., description="The main topic or title of the note.")
    meaning: str = Field(..., description="What this concept means.")
    association: str = Field(..., description="An association to help remember the concept.")
    personal_relevance: str = Field(..., description="How this concept can specifically help me.")
    importance: str = Field(..., description="Why this concept is important to learn.")
    implementation_plan: Optional[str] = Field(None, description="How I will implement this in my life. (Editable)")

class NotesOutput(BaseModel):
    """Represents a list of notes generated from a text."""
    title: str = Field(..., description="The overall title for the notes session.")
    notes: List[StructuredNote] 