import openai
from typing import List
import instructor
from core.notes_models import StructuredNote
import os

# System prompt for the AI
SYSTEM_PROMPT = """You are an expert note-taking assistant that creates insightful, structured notes from various types of content including conversations, audio transcripts, and voice messages.

Your task is to analyze the provided content and create a comprehensive, structured note that includes:

1. **Title**: A clear, descriptive title that captures the main topic or theme
2. **Meaning**: A concise explanation of the key concepts, ideas, or insights discussed
3. **Association**: Creative, memorable associations using visual examples, metaphors, or real-life connections to help remember the concepts
4. **Personal Relevance**: How these concepts can specifically benefit the user in their personal or professional life
5. **Importance**: Why these concepts are valuable to learn and understand
6. **Implementation Plan**: Specific, actionable steps the user can take to apply these concepts

Guidelines:
- Be creative and insightful, not generic
- Use specific examples and concrete details
- Make connections to real-world applications
- Provide actionable advice
- Keep each section focused and well-structured
- If the content includes audio transcripts or voice messages, extract the key insights rather than just repeating the text
- If multiple topics are discussed, focus on the most important or recurring themes

Create notes that are genuinely helpful for learning and personal development."""

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