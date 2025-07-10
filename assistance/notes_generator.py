import openai
from typing import List
import instructor
from core.models import NotesOutput, Note
import os

# System prompt for the AI
SYSTEM_PROMPT = "твоя задача это из текста делать заметки того что надо учить и сделать"

# Apply the patch to the OpenAI client
# enables response_model keyword
client = instructor.patch(openai.OpenAI())

def generate_note(source_text: str) -> Note:
    """Generate a structured note from a given source text."""
    try:
        # Generate structured output using instructor
        note = client.chat.completions.create(
            model="gpt-4o-mini",
            response_model=Note,
            messages=[
                {"role": "system", "content": "You are a note-taking assistant. Extract key information into a structured note."},
                {"role": "user", "content": source_text},
            ],
        )
        return note
    except Exception as e:
        # Basic error handling, can be improved with logging
        print(f"Error generating structured note: {e}")
        return Note(header="Fallback Note", text="Could not generate notes from text.", completed=False)

def generate_notes_from_messages(messages: List[str]) -> NotesOutput:
    """
    Generates structured notes from a list of messages using gpt-4o-mini.

    Args:
        messages (List[str]): A list of message contents from the chat.

    Returns:
        NotesOutput: A Pydantic object with the generated title and notes.
    """
    # Combine messages into a single text block
    full_text = "\\n".join(messages)

    # Generate structured output
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        response_model=NotesOutput,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": full_text},
        ],
    )
    return response 