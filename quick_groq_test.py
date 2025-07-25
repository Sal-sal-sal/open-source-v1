#!/usr/bin/env python3
"""
Быстрый тест Groq транскрипции для audio_chat.
Использует ваш пример кода для транскрипции аудио файла.
"""

import requests
import os
from dotenv import load_dotenv

# Загружаем переменные окружения
load_dotenv()

GROQ_API_URL = "https://api.groq.com/openai/v1/audio/transcriptions"
API_KEY = os.getenv("GROQ_API_KEY")

def transcribe_audio(file_path):
    """
    Функция транскрипции из вашего примера
    """
    headers = {
        "Authorization": f"Bearer {API_KEY}"
    }
    with open(file_path, "rb") as audio_file:
        files = {
            "file": audio_file
        }
        data = {
            "model": "whisper-large-v3-turbo",
            "response_format": "json",
            "language": "en"  # или укажи нужный язык
        }
        response = requests.post(GROQ_API_URL, headers=headers, files=files, data=data)

    if response.status_code == 200:
        return response.json()["text"]
    else:
        print("Ошибка:", response.status_code, response.text)
        return None

def main():
    print("🎵 Быстрый тест Groq транскрипции")
    print("=" * 40)
    
    # Проверяем API ключ
    if not API_KEY:
        print("❌ GROQ_API_KEY не найден!")
        print("Добавьте GROQ_API_KEY=your_key в файл .env")
        return
    
    print("✅ GROQ_API_KEY найден")
    
    # Ищем аудио файлы в uploads
    uploads_dir = "uploads"
    audio_files = []
    
    if os.path.exists(uploads_dir):
        for file in os.listdir(uploads_dir):
            if file.lower().endswith(('.mp3', '.wav', '.webm', '.m4a', '.ogg')):
                audio_files.append(os.path.join(uploads_dir, file))
    
    if not audio_files:
        print("❌ Аудио файлы не найдены в директории uploads/")
        print("Поместите аудио файл в директорию uploads/ для тестирования")
        return
    
    print(f"✅ Найдено {len(audio_files)} аудио файлов:")
    for i, file in enumerate(audio_files, 1):
        print(f"  {i}. {os.path.basename(file)}")
    
    # Выбираем файл
    if len(audio_files) == 1:
        selected_file = audio_files[0]
        print(f"✅ Автоматически выбран: {os.path.basename(selected_file)}")
    else:
        while True:
            try:
                choice = input(f"Выберите файл (1-{len(audio_files)}): ").strip()
                file_index = int(choice) - 1
                if 0 <= file_index < len(audio_files):
                    selected_file = audio_files[file_index]
                    break
                else:
                    print("❌ Неверный номер")
            except ValueError:
                print("❌ Введите число")
    
    print(f"\n🔄 Транскрибирую файл: {os.path.basename(selected_file)}")
    print("Используется модель: whisper-large-v3-turbo")
    
    # Выполняем транскрипцию
    result = transcribe_audio(selected_file)
    
    if result:
        print("\n" + "=" * 40)
        print("📝 РЕЗУЛЬТАТ ТРАНСКРИПЦИИ:")
        print("=" * 40)
        print(result)
        print("=" * 40)
        
        # Сохраняем результат
        output_file = f"transcript_{os.path.basename(selected_file)}.txt"
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(result)
        print(f"\n💾 Результат сохранен в: {output_file}")
        
    else:
        print("❌ Транскрипция не удалась")

if __name__ == "__main__":
    main() 