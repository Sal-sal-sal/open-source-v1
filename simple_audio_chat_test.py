#!/usr/bin/env python3
"""
Упрощенный скрипт для тестирования audio_chat с Groq Whisper.
Этот скрипт использует существующий API для транскрипции аудио файлов.
"""

import os
import requests
import json
from dotenv import load_dotenv
from pathlib import Path

# Загружаем переменные окружения
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
API_BASE_URL = "http://localhost:8000"  # URL вашего FastAPI сервера

def test_groq_transcription_file(audio_file_path):
    """
    Тестирует транскрипцию аудио файла через Groq API
    
    Args:
        audio_file_path: путь к аудио файлу
        
    Returns:
        str: транскрибированный текст
    """
    if not GROQ_API_KEY:
        print("❌ GROQ_API_KEY не найден в переменных окружения")
        print("Добавьте GROQ_API_KEY=your_key в файл .env")
        return None
    
    if not os.path.exists(audio_file_path):
        print(f"❌ Файл {audio_file_path} не найден")
        return None
    
    print(f"🔄 Отправляю файл {audio_file_path} на транскрипцию через Groq...")
    
    GROQ_API_URL = "https://api.groq.com/openai/v1/audio/transcriptions"
    
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}"
    }
    
    try:
        with open(audio_file_path, "rb") as audio_file:
            files = {
                "file": audio_file
            }
            data = {
                "model": "whisper-large-v3-turbo",
                "response_format": "json"
            }
            
            response = requests.post(GROQ_API_URL, headers=headers, files=files, data=data)
            
        if response.status_code == 200:
            result = response.json()
            transcript = result.get("text", "")
            print("✅ Транскрипция успешно завершена!")
            return transcript
        else:
            print(f"❌ Ошибка транскрипции: {response.status_code}")
            print(f"Ответ сервера: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Ошибка при отправке запроса: {str(e)}")
        return None

def test_local_api_transcription(audio_file_path):
    """
    Тестирует транскрипцию через локальный API с принудительным использованием Groq
    
    Args:
        audio_file_path: путь к аудио файлу
        
    Returns:
        str: транскрибированный текст
    """
    if not os.path.exists(audio_file_path):
        print(f"❌ Файл {audio_file_path} не найден")
        return None
    
    print(f"🔄 Отправляю файл {audio_file_path} на транскрипцию через локальный API (Groq)...")
    
    try:
        with open(audio_file_path, "rb") as audio_file:
            files = {
                "file": audio_file
            }
            data = {
                "service": "groq"  # Принудительно используем Groq
            }
            
            response = requests.post(f"{API_BASE_URL}/api/audio/transcript/", files=files, data=data)
            
        if response.status_code == 200:
            result = response.json()
            transcript = result.get("transcript", "")
            service_used = result.get("service_used", "unknown")
            print(f"✅ Транскрипция успешно завершена! Использован сервис: {service_used}")
            return transcript
        else:
            print(f"❌ Ошибка транскрипции: {response.status_code}")
            print(f"Ответ сервера: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Ошибка при отправке запроса: {str(e)}")
        return None

def get_available_services():
    """Получает информацию о доступных сервисах транскрипции"""
    try:
        response = requests.get(f"{API_BASE_URL}/api/audio/transcription-services")
        
        if response.status_code == 200:
            services = response.json()
            print("📋 Доступные сервисы транскрипции:")
            for service_name, service_info in services.items():
                if service_name != "preferred":
                    status = "✅ Доступен" if service_info["available"] else "❌ Недоступен"
                    print(f"  {service_name}: {status} ({service_info['name']})")
            return services
        else:
            print(f"❌ Ошибка получения сервисов: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ Ошибка при получении сервисов: {str(e)}")
        return None

def find_audio_files():
    """Ищет аудио файлы в директории uploads"""
    uploads_dir = Path("uploads")
    audio_extensions = [".mp3", ".wav", ".webm", ".m4a", ".ogg"]
    
    audio_files = []
    
    if uploads_dir.exists():
        for ext in audio_extensions:
            audio_files.extend(uploads_dir.glob(f"*{ext}"))
    
    return audio_files

def main():
    """Главная функция"""
    print("🎵 Audio Chat - Groq Whisper Integration Test")
    print("=" * 60)
    
    # Проверяем доступность Groq API
    if not GROQ_API_KEY:
        print("❌ GROQ_API_KEY не настроен")
        print("1. Получите API ключ на https://console.groq.com/")
        print("2. Добавьте GROQ_API_KEY=your_key в файл .env")
        return
    
    print("✅ GROQ_API_KEY найден")
    
    # Получаем информацию о доступных сервисах
    print("\n" + "=" * 60)
    services = get_available_services()
    
    if not services:
        print("⚠️  Не удалось получить информацию о сервисах")
        print("Убедитесь, что FastAPI сервер запущен на http://localhost:8000")
    
    # Ищем аудио файлы
    print("\n" + "=" * 60)
    print("🔍 Поиск аудио файлов...")
    audio_files = find_audio_files()
    
    if not audio_files:
        print("❌ Аудио файлы не найдены в директории uploads/")
        print("Поместите аудио файл в директорию uploads/ для тестирования")
        return
    
    print(f"✅ Найдено {len(audio_files)} аудио файлов:")
    for i, file in enumerate(audio_files, 1):
        print(f"  {i}. {file.name}")
    
    # Выбираем файл для тестирования
    print("\n" + "=" * 60)
    while True:
        try:
            choice = input(f"Выберите файл для тестирования (1-{len(audio_files)}): ").strip()
            file_index = int(choice) - 1
            if 0 <= file_index < len(audio_files):
                selected_file = audio_files[file_index]
                break
            else:
                print("❌ Неверный номер файла")
        except ValueError:
            print("❌ Введите корректное число")
    
    print(f"✅ Выбран файл: {selected_file.name}")
    
    # Тестируем транскрипцию через локальный API
    print("\n" + "=" * 60)
    print("🧪 ТЕСТИРОВАНИЕ ТРАНСКРИПЦИИ")
    print("=" * 60)
    
    # Тест 1: Через локальный API с Groq
    print("\n1️⃣ Тест через локальный API (Groq):")
    transcript_local = test_local_api_transcription(str(selected_file))
    
    if transcript_local:
        print("\n📝 РЕЗУЛЬТАТ (Локальный API):")
        print("-" * 40)
        print(transcript_local)
        print("-" * 40)
    
    # Тест 2: Прямо через Groq API
    print("\n2️⃣ Тест напрямую через Groq API:")
    transcript_direct = test_groq_transcription_file(str(selected_file))
    
    if transcript_direct:
        print("\n📝 РЕЗУЛЬТАТ (Прямой Groq API):")
        print("-" * 40)
        print(transcript_direct)
        print("-" * 40)
    
    # Сравнение результатов
    if transcript_local and transcript_direct:
        print("\n" + "=" * 60)
        print("🔍 СРАВНЕНИЕ РЕЗУЛЬТАТОВ")
        print("=" * 60)
        
        if transcript_local.strip() == transcript_direct.strip():
            print("✅ Результаты идентичны!")
        else:
            print("⚠️  Результаты различаются:")
            print(f"Локальный API: {transcript_local}")
            print(f"Прямой Groq:  {transcript_direct}")
    
    # Сохраняем результаты
    if transcript_local or transcript_direct:
        print("\n" + "=" * 60)
        print("💾 СОХРАНЕНИЕ РЕЗУЛЬТАТОВ")
        print("=" * 60)
        
        results = {
            "audio_file": str(selected_file),
            "file_size": os.path.getsize(selected_file),
            "local_api_transcript": transcript_local,
            "direct_groq_transcript": transcript_direct,
            "services_available": services
        }
        
        output_file = f"transcription_test_results_{selected_file.stem}.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        
        print(f"✅ Результаты сохранены в файл: {output_file}")

if __name__ == "__main__":
    main() 