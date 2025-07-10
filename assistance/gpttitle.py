import os
import json
from dotenv import load_dotenv
from openai import OpenAI
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from core.chat_db import add_message, get_history

load_dotenv()

# --- Клиент OpenAI ---
# Используем ключ от OpenAI
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise ValueError("Не найден ключ OPENAI_API_KEY")

# Убираем base_url, чтобы использовать API OpenAI по умолчанию
client = OpenAI(api_key=openai_api_key)

async def response_to_user(
    session: AsyncSession,
    chat_id: str,
    user_id: str,
    history: Optional[List[Dict[str, Any]]],
    user_message: str,
) -> str:
    """
    Возвращает ответ AI на новое сообщение пользователя.
    """
    # Получаем историю диалога из базы данных, теперь с user_id
    db_history = await get_history(session, chat_id, user_id)
    if db_history:
        history = db_history
    else:
        history = history or []

    content: List[Dict[str, Any]] = []
    
    # Добавляем текст
    if user_message:
        content.append({"type": "text", "text": user_message})
    
    if not content:
        return "Пожалуйста, предоставьте текст."

    # Формируем полный список сообщений для AI\
    system_prompt = {
        "role": "system",
        "content": """твоя задачи абстрагировать текст, чтобы получить заголовок для книги для чата. длинна должна  не привышать 30 символов или же 4 слова. если что ты отвечаешь от 3 го лица и отвечаешь о сути промта напремер
        user: в чем смысл жизни?
        название чата = как найти смысл жизни?
        тоесть ты говоришь в названии чата чем данный чат полезен и одновременно с эти м название не должно быть длинее 4 слов
        """  # <- твоя настройка поведения
    }
    messages_for_ai = [system_prompt] + history + [{"role": "user", "content": content}]

    model_to_use = "gpt-4o"
    
    # Запрос к модели
    response = client.chat.completions.create(
        model=model_to_use,
        messages=messages_for_ai,
    )
    
    response_message = response.choices[0].message
    
    # Сохраняем ответ AI в БД
    await add_message(session, chat_id, user_id, "assistant", response_message.content or "")

    return response_message.content
