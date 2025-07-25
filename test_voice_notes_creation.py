#!/usr/bin/env python3
"""
Тестовый скрипт для проверки создания заметок из голосовых сообщений.
Тестирует автоматическое создание заметок при отправке голосовых сообщений.
"""

import os
import requests
import json
import time
from dotenv import load_dotenv

# Загружаем переменные окружения
load_dotenv()

API_BASE_URL = "http://localhost:8000"
API_KEY = os.getenv("GROQ_API_KEY")

def test_voice_message_to_note(audio_file_path, note_title="Test Voice Note"):
    """Тестирует создание заметки из голосового сообщения"""
    print(f"🎤 Тестирую создание заметки из голосового сообщения...")
    print(f"📁 Файл: {os.path.basename(audio_file_path)}")
    print(f"📝 Заголовок: {note_title}")
    
    url = f"{API_BASE_URL}/api/voice-notes/create-from-voice-message/"
    
    # Подготавливаем данные для отправки
    with open(audio_file_path, 'rb') as audio_file:
        files = {
            'voice_file': (os.path.basename(audio_file_path), audio_file, 'audio/webm')
        }
        
        data = {
            'note_title': note_title,
            'note_content': 'Это тестовая заметка, созданная из голосового сообщения.',
            'tags': 'тест,голос,автоматически'
        }
        
        # Отправляем запрос
        start_time = time.time()
        response = requests.post(url, files=files, data=data)
        end_time = time.time()
        
        processing_time = end_time - start_time
        
        print(f"⏱️  Время запроса: {processing_time:.2f} секунд")
        print(f"📊 Статус ответа: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Заметка успешно создана!")
            print(f"🎯 Время транскрибации: {result.get('transcription', {}).get('processing_time', 0):.2f} секунд")
            print(f"📝 Длина заметки: {result.get('note_length', 0)} символов")
            print(f"🔗 GCS URL: {result.get('transcription', {}).get('gcs_url', 'N/A')}")
            
            # Показываем содержимое заметки
            note_content = result.get('note', {}).get('content', '')
            if note_content:
                print("\n📄 СОДЕРЖИМОЕ ЗАМЕТКИ:")
                print("-" * 50)
                print(note_content[:500] + "..." if len(note_content) > 500 else note_content)
                print("-" * 50)
            
            return result
        elif response.status_code == 401:
            print("❌ Ошибка аутентификации (401 Unauthorized)")
            print("💡 Нужен валидный токен аутентификации")
            return None
        elif response.status_code == 400:
            print("❌ Ошибка запроса (400 Bad Request)")
            try:
                error_detail = response.json()
                print(f"📋 Детали: {error_detail}")
            except:
                print(f"📋 Ответ: {response.text}")
            return None
        else:
            print(f"❌ Неожиданная ошибка: {response.status_code}")
            print(f"📋 Ответ: {response.text}")
            return None

def test_combined_note_creation(audio_file_path, transcript_file_id, note_title="Test Combined Note"):
    """Тестирует создание комбинированной заметки"""
    print(f"🎤 Тестирую создание комбинированной заметки...")
    print(f"📁 Файл: {os.path.basename(audio_file_path)}")
    print(f"📄 Transcript ID: {transcript_file_id}")
    print(f"📝 Заголовок: {note_title}")
    
    url = f"{API_BASE_URL}/api/voice-notes/create-from-voice-and-transcript/"
    
    # Подготавливаем данные для отправки
    with open(audio_file_path, 'rb') as audio_file:
        files = {
            'voice_file': (os.path.basename(audio_file_path), audio_file, 'audio/webm')
        }
        
        data = {
            'transcript_file_id': transcript_file_id,
            'note_title': note_title,
            'note_content': 'Это комбинированная заметка из аудиокниги и голосового сообщения.',
            'tags': 'тест,комбинированная,аудиокнига,голос'
        }
        
        # Отправляем запрос
        start_time = time.time()
        response = requests.post(url, files=files, data=data)
        end_time = time.time()
        
        processing_time = end_time - start_time
        
        print(f"⏱️  Время запроса: {processing_time:.2f} секунд")
        print(f"📊 Статус ответа: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Комбинированная заметка успешно создана!")
            print(f"🎯 Время транскрибации голоса: {result.get('transcription', {}).get('voice_processing_time', 0):.2f} секунд")
            print(f"📝 Длина заметки: {result.get('note_length', 0)} символов")
            print(f"📚 Длина транскрипции: {result.get('transcription', {}).get('transcript_length', 0)} символов")
            print(f"🎤 Длина голосового сообщения: {result.get('transcription', {}).get('voice_message_length', 0)} символов")
            
            # Показываем содержимое заметки
            note_content = result.get('note', {}).get('content', '')
            if note_content:
                print("\n📄 СОДЕРЖИМОЕ КОМБИНИРОВАННОЙ ЗАМЕТКИ:")
                print("-" * 50)
                print(note_content[:500] + "..." if len(note_content) > 500 else note_content)
                print("-" * 50)
            
            return result
        elif response.status_code == 404:
            print("❌ Транскрипция не найдена (404 Not Found)")
            print("💡 Убедитесь, что transcript_file_id существует")
            return None
        elif response.status_code == 401:
            print("❌ Ошибка аутентификации (401 Unauthorized)")
            return None
        else:
            print(f"❌ Ошибка: {response.status_code}")
            print(f"📋 Ответ: {response.text}")
            return None

def find_audio_files():
    """Находит аудио файлы для тестирования"""
    audio_files = []
    
    # Ищем в папке uploads
    uploads_dir = "uploads"
    if os.path.exists(uploads_dir):
        for file in os.listdir(uploads_dir):
            if file.lower().endswith(('.mp3', '.wav', '.webm', '.m4a')):
                audio_files.append(os.path.join(uploads_dir, file))
    
    # Ищем в корневой папке
    for file in os.listdir('.'):
        if file.lower().endswith(('.mp3', '.wav', '.webm', '.m4a')):
            audio_files.append(file)
    
    return audio_files

def find_transcript_files():
    """Находит существующие транскрипции для комбинированных заметок"""
    # Это заглушка - в реальной системе нужно получить список из GCS или БД
    # Пока возвращаем тестовый ID
    return ["test-transcript-id-123"]

def main():
    """Главная функция"""
    print("🎵 Тест создания заметок из голосовых сообщений")
    print("=" * 60)
    
    if not API_KEY:
        print("❌ GROQ_API_KEY не найден в переменных окружения")
        print("Добавьте GROQ_API_KEY=your_key в файл .env")
        return
    
    print("✅ GROQ_API_KEY найден")
    
    # Проверяем доступность API
    try:
        response = requests.get(f"{API_BASE_URL}/docs")
        if response.status_code == 200:
            print("✅ API сервер доступен")
        else:
            print("⚠️  API сервер может быть недоступен")
    except Exception as e:
        print(f"❌ Не удается подключиться к API: {str(e)}")
        print("Убедитесь, что сервер запущен на http://localhost:8000")
        return
    
    # Находим аудио файлы
    audio_files = find_audio_files()
    
    if not audio_files:
        print("❌ Аудио файлы не найдены")
        print("Поместите .mp3, .wav, .webm или .m4a файлы в папку uploads/ или в корневую папку")
        return
    
    print(f"📁 Найдено {len(audio_files)} аудио файлов:")
    for i, file_path in enumerate(audio_files, 1):
        size = os.path.getsize(file_path) / (1024 * 1024)
        print(f"  {i}. {os.path.basename(file_path)} ({size:.2f} MB)")
    
    # Выбираем файл для тестирования
    while True:
        try:
            choice = input(f"\nВыберите файл для тестирования (1-{len(audio_files)}): ").strip()
            file_index = int(choice) - 1
            if 0 <= file_index < len(audio_files):
                selected_file = audio_files[file_index]
                break
            else:
                print("❌ Неверный номер файла")
        except ValueError:
            print("❌ Введите число")
    
    print(f"\n🎵 Выбран файл: {os.path.basename(selected_file)}")
    
    # Запрашиваем токен аутентификации
    auth_token = input("\nВведите токен аутентификации: ").strip()
    
    if not auth_token:
        print("❌ Токен аутентификации обязателен для создания заметок")
        return
    
    # Настраиваем заголовки для всех запросов
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    # Тест 1: Создание заметки из голосового сообщения
    print("\n" + "=" * 60)
    print("🏁 ТЕСТ 1: Создание заметки из голосового сообщения")
    print("=" * 60)
    
    note_title = f"Тестовая заметка {int(time.time())}"
    result1 = test_voice_message_to_note(selected_file, note_title)
    
    # Тест 2: Создание комбинированной заметки (если есть транскрипции)
    print("\n" + "=" * 60)
    print("🏁 ТЕСТ 2: Создание комбинированной заметки")
    print("=" * 60)
    
    transcript_files = find_transcript_files()
    if transcript_files:
        print(f"📄 Найдено {len(transcript_files)} транскрипций для комбинирования")
        
        # Используем первую доступную транскрипцию
        transcript_id = transcript_files[0]
        combined_title = f"Комбинированная заметка {int(time.time())}"
        result2 = test_combined_note_creation(selected_file, transcript_id, combined_title)
    else:
        print("⚠️  Транскрипции не найдены, пропускаем комбинированный тест")
        result2 = None
    
    # Анализ результатов
    print("\n" + "=" * 60)
    print("📊 АНАЛИЗ РЕЗУЛЬТАТОВ")
    print("=" * 60)
    
    if result1:
        print("✅ Тест 1 (голосовое сообщение): УСПЕШЕН")
        print(f"📝 Создана заметка: {result1.get('note', {}).get('title', 'Unknown')}")
        print(f"⏱️  Время транскрибации: {result1.get('transcription', {}).get('processing_time', 0):.2f} сек")
    else:
        print("❌ Тест 1 (голосовое сообщение): ПРОВАЛЕН")
    
    if result2:
        print("✅ Тест 2 (комбинированная): УСПЕШЕН")
        print(f"📝 Создана комбинированная заметка: {result2.get('note', {}).get('title', 'Unknown')}")
        print(f"⏱️  Время транскрибации: {result2.get('transcription', {}).get('voice_processing_time', 0):.2f} сек")
    else:
        print("❌ Тест 2 (комбинированная): ПРОВАЛЕН или пропущен")
    
    # Сохраняем результаты
    timestamp = int(time.time())
    results_file = f"voice_notes_test_{timestamp}.json"
    
    test_data = {
        "timestamp": timestamp,
        "selected_file": selected_file,
        "auth_token_provided": bool(auth_token),
        "results": {
            "voice_message_note": result1,
            "combined_note": result2
        }
    }
    
    with open(results_file, 'w', encoding='utf-8') as f:
        json.dump(test_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n💾 Результаты сохранены в файл: {results_file}")
    
    print("\n" + "=" * 60)
    print("✅ ТЕСТИРОВАНИЕ ЗАВЕРШЕНО")
    print("=" * 60)
    
    if result1 or result2:
        print("\n🎉 Заметки успешно созданы!")
        print("💡 Теперь вы можете проверить их в интерфейсе приложения")
    else:
        print("\n⚠️  Создание заметок не удалось")
        print("💡 Проверьте логи сервера для получения дополнительной информации")

if __name__ == "__main__":
    main() 