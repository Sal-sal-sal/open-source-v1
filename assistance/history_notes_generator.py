import openai
from typing import List, Dict
import instructor
from core.notes_models import StructuredNote

client = instructor.patch(openai.OpenAI())

def generate_structured_notes(history: List[Dict[str, str]]) -> StructuredNote:
    """
    Generates structured notes from a chat history using gpt-4o-mini.
    """
    history_str = "\\n".join([f"{msg['role']}: {msg['content']}" for msg in history])

    prompt = f"""
Based on the following chat history, please create a structured note that explains the main concept discussed.

CHAT HISTORY:
{history_str}
---
"""

    try:
        notes = client.chat.completions.create(
            model="gpt-4o-mini",
            response_model=StructuredNote,
            messages=[
                {"role": "system", "content": "You are an expert at creating structured educational notes from text. Your task is to analyze the conversation and provide a structured note with an explanation, an analogy, and a real-life application."},
                {"role": "user", "content": prompt},
            ],
        )
        return notes
    except Exception as e:
        print(f"Error generating structured notes: {e}")
        # Return a fallback note in case of an error
        return StructuredNote(
            explanation={"meaning": "Could not generate explanation."},
            analogy={"analogy": "Could not generate analogy."},
            application={"application": "Could not generate application."},
        ) 