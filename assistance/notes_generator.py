import openai
from typing import List
import instructor
from core.notes_models import StructuredNote
import os

# System prompt for the AI
SYSTEM_PROMPT = """Your task is to create structured, insightful notes from a given text. For each key concept, provide the following:
1.  **Meaning**: What does this concept mean?
2.  **Association**: What is a memorable association for this concept? use more visual examples and real life examples
3.  **Personal Relevance**: How can this concept specifically help the user?
4.  **Importance**: Why is this concept important to learn?
5.  **Implementation Plan**: Suggest a practical way the user can implement this in their life.
"""

# Apply the patch to the OpenAI client
client = instructor.patch(openai.OpenAI())

def generate_structured_note(source_text: str) -> StructuredNote:
    """Generate a single structured note from a given source text."""
    try:
        note = client.chat.completions.create(
            model="gpt-4o-mini",
            response_model=StructuredNote,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Please generate a structured note for the following text:\n\n{source_text}"},
            ],
        )
        return note
    except Exception as e:
        print(f"Error generating structured note: {e}")
        # Return a fallback note on error
        return StructuredNote(
            title="Error",
            meaning="Could not generate note.",
            association="N/A",
            personal_relevance="N/A",
            importance="N/A",
            implementation_plan="N/A"
        ) 