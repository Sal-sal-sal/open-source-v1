import os
from dotenv import load_dotenv
from openai import OpenAI
from typing import List, Dict, Any

load_dotenv()

# --- OpenAI Client ---
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise ValueError("OPENAI_API_KEY not found in environment variables")

client = OpenAI(api_key=openai_api_key)

async def generate_chat_title_from_ai(user_first_message: str) -> str:
    """
    Generates a concise chat title using an AI model.
    """
    system_prompt = {
        "role": "system",
        "content": "Your task is to create a very short, concise title for a chat session based on the user's first message. The title should not exceed 5 words or 30 characters. Respond with only the title and nothing else."
    }
    
    user_prompt = {
        "role": "user",
        "content": user_first_message
    }

    messages_for_ai: List[Dict[str, Any]] = [system_prompt, user_prompt]

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",  # Using a faster model for this simple task
            messages=messages_for_ai,
            temperature=0.2,
            max_tokens=20,
        )
        title = response.choices[0].message.content or "New Chat"
        return title.strip().strip('"')
    except Exception as e:
        print(f"Error generating chat title: {e}")
        # Fallback to a simple truncation if AI fails
        return (user_first_message[:27] + '...') if len(user_first_message) > 30 else user_first_message 