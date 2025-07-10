
import google.generativeai as genai  # type: ignore
import os
import dotenv
dotenv.load_dotenv()

# Настройка Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
model = genai.GenerativeModel(model_name)

print(model.generate_content('how are u doing'))