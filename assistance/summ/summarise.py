import os

from openai import OpenAI
from dotenv import load_dotenv
from assistance.summ.youtube_trans import get_transcript

# Gemini
try:
    import google.generativeai as genai
except ImportError:
    genai = None  # type: ignore

load_dotenv()

# Choose provider based on available keys
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY and genai is not None:
    genai.configure(api_key=GEMINI_API_KEY)
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    PROVIDER = "gemini"
else:
    if not OPENAI_API_KEY:
        raise RuntimeError("Neither GEMINI_API_KEY nor OPENAI_API_KEY set")
    client = OpenAI(api_key=OPENAI_API_KEY)
    MODEL_NAME = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    PROVIDER = "openai"

def summarize_text(text_to_summarize: str) -> str:
    """
    Summarizes the given text using the OpenAI GPT-4o model.

    Args:
        text_to_summarize: The text content to be summarized.

    Returns:
        The summarized text as a string.
    """
    if not text_to_summarize:
        return "No text provided to summarize."

    try:
        # debug print
        # print(client, client.chat.completions)
        if PROVIDER == "gemini":
            model = genai.GenerativeModel(GEMINI_MODEL)
            response = model.generate_content(
                f"Сделай краткое содержательное резюме (3–5 предложений) следующего текста:\n\n{text_to_summarize}",
                safety_settings={}
            )
            summary = response.text  # type: ignore
        else:
            response = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a highly skilled assistant that summarizes text. "
                                   "Provide a concise summary of the following content:",
                    },
                    {"role": "user", "content": text_to_summarize},
                ],
                temperature=0.5,
                max_tokens=150,
                top_p=1.0,
                frequency_penalty=0.0,
                presence_penalty=0.0,
            )
            summary = response.choices[0].message.content
        print(summary)
        return summary.strip() if summary else "Could not generate a summary."

    except Exception as e:
        # Log the error for debugging purposes
        print(f"An error occurred while calling the OpenAI API: {e}")
        return "Failed to generate summary due to an API error."

def summarise_video(video_url: str) -> str:
    """Return summary for video url using chosen LLM provider."""
    transcript = get_transcript(video_url)
    summary = summarize_text(transcript)
    print(summary)
    return summary