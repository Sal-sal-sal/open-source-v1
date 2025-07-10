import os
import json
from dotenv import load_dotenv
from openai import OpenAI
from typing import List, Dict, Any, Optional, AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession

# Импортируем нашего агента поиска
from .google_search import GoogleSearchAgent
from .txt_to_image import generate_image_from_prompt
from core.image_db import save_image_record
from core.chat_db import add_message, get_history

load_dotenv()

# --- Клиент OpenAI ---
# Используем ключ от OpenAI
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise ValueError("Не найден ключ OPENAI_API_KEY")

# Убираем base_url, чтобы использовать API OpenAI по умолчанию
client = OpenAI(api_key=openai_api_key)

# --- Клиент Google Search ---
google_api_key = os.getenv("GOOGLE_API_KEY")
google_cx_id = os.getenv("GOOGLE_CX_ID")
search_agent = GoogleSearchAgent(api_key=google_api_key, cx_id=google_cx_id)

def search_google(query: str) -> str:
    """
    Выполняет поиск в Google и возвращает результаты в формате JSON.
    Используется, когда нужна актуальная информация или данные из интернета.
    """
    print(f"--- Выполняется поиск по запросу: {query} ---")
    results = search_agent.search(query)
    # Возвращаем только заголовки и ссылки для экономии токенов
    simplified_results = [{"title": item.get("title"), "link": item.get("link")} for item in results[:5]]
    return json.dumps(simplified_results, ensure_ascii=False)

def search_google_images(query: str) -> str:
    """
    Ищет изображения в Google по запросу. Используется, когда пользователь просит найти или показать изображение.
    Возвращает список URL-адресов изображений.
    """
    print(f"--- Выполняется поиск изображений по запросу: {query} ---")
    results = search_agent.search_images(query)
    # Возвращаем только прямые ссылки на изображения
    image_urls = [item.get("link") for item in results[:5] if item.get("link")]
    return json.dumps(image_urls, ensure_ascii=False)

def generate_image_tool(prompt: str) -> str:
    """
    Генерирует изображение по текстовому описанию с помощью Vertex AI. 
    Используй, когда пользователь просит 'создать', 'сгенерировать', 'нарисовать' изображение или картинку.
    Возвращает JSON с UUID сгенерированного изображения.
    """
    print(f"--- Выполняется генерация изображения (Vertex AI) по запросу: {prompt} ---")
    
    # Вызываем вашу функцию из txt_to_image.py
    image_bytes = generate_image_from_prompt(prompt) 
    
    if image_bytes:
        uuid = save_image_record(prompt, image_bytes)
        return json.dumps({"status": "success", "uuid": uuid, "prompt": prompt})
    else:
        return json.dumps({"status": "error", "message": "Не удалось сгенерировать изображение через Vertex AI."})

# Описание инструментов для модели
tools = [
    {
        "type": "function",
        "function": {
            "name": "search_google",
            "description": "Ищет в Google информацию по заданному запросу. Полезно для получения актуальных данных, новостей, фактов.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Поисковый запрос, например 'погода в Москве' или 'последние новости о SpaceX'",
                    },
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_google_images",
            "description": "Ищет в Google изображения по запросу. Используй, когда пользователь просит найти, показать или прислать картинку/изображение/фото.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Описание изображения для поиска, например 'котята' или 'Эйфелева башня ночью'",
                    },
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "generate_image_tool",
            "description": "Создает (генерирует, рисует) новое изображение по текстовому описанию (промпту). Не используй для поиска существующих изображений.",
            "parameters": {
                "type": "object",
                "properties": {
                    "prompt": {
                        "type": "string",
                        "description": "Детальное описание изображения, которое нужно создать. Например: 'рыжий кот в шляпе волшебника' или 'футуристический город на Марсе'.",
                    },
                },
                "required": ["prompt"],
            },
        },
    }
]

async def response_to_user(
    session: AsyncSession,
    chat_id: str,
    user_id: str,
    history: Optional[List[Dict[str, Any]]],
    user_message: str,
    image_base64: Optional[str] = None,
) -> AsyncGenerator[str, None]:
    """
    Yields chunks of AI response for a new user message.
    """
    # Получаем историю диалога из базы данных, теперь с user_id
    db_history = await get_history(session, chat_id, user_id)
    if db_history:
        history = db_history
    else:
        history = history or []

    content: List[Dict[str, Any]] = []
    
    # Добавляем текст, если он есть
    if user_message:
        content.append({"type": "text", "text": user_message})
    
    # Добавляем изображение, если оно есть
    if image_base64:
        content.append({
            "type": "image_url",
            "image_url": {
                "url": f"data:image/jpeg;base64,{image_base64}"
            }
        })
    
    if not content:
        yield "Пожалуйста, предоставьте текст или изображение."
        return

    messages_for_ai = history + [{"role": "user", "content": content}]

    model_to_use = "gpt-4o"
    
    # First request to the model with streaming enabled
    stream = client.chat.completions.create(
        model=model_to_use,
        messages=messages_for_ai,
        tools=tools,
        tool_choice="auto",
        stream=True,
    )
    
    full_response_content = ""
    tool_calls = []
    for chunk in stream:
        delta = chunk.choices[0].delta
        if delta.content:
            full_response_content += delta.content
            yield delta.content
        if delta.tool_calls:
            tool_calls.extend(delta.tool_calls)

    if tool_calls:
        # This part will not stream the final response, but the tool usage itself is not a streaming operation.
        # The logic for handling tool calls remains largely the same, but it won't yield chunks.
        # A more advanced implementation might stream even after tool use, but this is a solid start.
        print("--- Модель решила использовать инструмент ---")
        
        # We need the full response message with tool calls to proceed
        response_message = {"role": "assistant", "content": full_response_content, "tool_calls": tool_calls}
        messages_for_ai.append(response_message)
        
        available_functions = {
            "search_google": search_google,
            "search_google_images": search_google_images,
            "generate_image_tool": generate_image_tool,
        }
        
        for tool_call in tool_calls:
            function_name = tool_call.function.name
            function_to_call = available_functions[function_name]
            function_args = json.loads(tool_call.function.arguments)
            function_response = function_to_call(**function_args)
            
            messages_for_ai.append(
                {
                    "tool_call_id": tool_call.id,
                    "role": "tool",
                    "name": function_name,
                    "content": function_response,
                }
            )
        
        # Second request to get the final, synthesized response
        second_response_stream = client.chat.completions.create(
            model=model_to_use,
            messages=messages_for_ai,
            stream=True
        )
        
        for chunk in second_response_stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
