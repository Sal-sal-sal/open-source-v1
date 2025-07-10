import openai
from typing import List, Dict

client = openai.OpenAI()

def generate_book_chat_response(history: List[Dict[str, str]], book_text: str) -> str:
    """
    Generates a response for a book chat using the book's text and chat history.
    """
    # Combine messages into a single string for the prompt
    history_str = "\\n".join([f"{msg['role']}: {msg['content']}" for msg in history])

    # Create a prompt that includes the book's text and the chat history
    prompt = f"""
You are a helpful assistant responding to questions about a book.
The full text of the book is provided below.
---
BOOK TEXT:
{book_text}
---
CHAT HISTORY:
{history_str}
---
Based on the book's text and the chat history, please provide a helpful and relevant response to the last user message.
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful assistant for book chats."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
        )
        return response.choices[0].message.content or "I'm sorry, I couldn't generate a response."
    except Exception as e:
        print(f"Error generating book chat response: {e}")
        return "There was an error processing your request. Please try again later." 