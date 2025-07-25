#!/usr/bin/env python3
"""
Тестовый скрипт для проверки создания заметок из голосовых сообщений.
Тестирует новые endpoints для автоматической транскрибации и создания заметок.
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

def test_create_note_from_voice_message(audio_file_path, note_title, note_content="", tags=""):
    """Тестирует создание заметки из голосового сообщения"""
    print(f"🎤 Тестирую создание заметки из голосового сообщения...")
    print(f"📁 Файл: {os.path.basename(audio_file_path)}")
    print(f"📝 Заголовок: {note_title}")
    
    url = f"{API_BASE_URL}/api/notes/create-from-voice-message/"
    
    # Подготавливаем данные для отправки
    with open(audio_file_path, 'rb') as audio_file:
        files = {
            'voice_file': (os.path.basename(audio_file_path), audio_file, 'audio/mpeg')
        }
        
        data = {
            'note_title': note_title,
            'note_content': note_content,
            'tags': tags
        }
        
        # Отправляем запрос
        start_time = time.time()
        response = requests.post(url, files=files, data=data)
        end_time = time.time()
        
        processing_time = end_time - start_time
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Заметка успешно создана!")
            print(f"⏱️  Общее время обработки: {processing_time:.2f} секунд")
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
        else:
            print(f"❌ Ошибка: {response.status_code}")
            print(f"Ответ: {response.text}")
            return None

def test_create_note_from_voice_and_transcript(audio_file_path, transcript_file_id, note_title, note_content="", tags=""):
    """Тестирует создание заметки из голосового сообщения и существующей транскрипции"""
    print(f"🎤 Тестирую создание заметки из голосового сообщения и транскрипции...")
    print(f"📁 Голосовой файл: {os.path.basename(audio_file_path)}")
    print(f"📚 ID транскрипции: {transcript_file_id}")
    print(f"📝 Заголовок: {note_title}")
    
    url = f"{API_BASE_URL}/api/notes/create-from-voice-and-transcript/"
    
    # Подготавливаем данные для отправки
    with open(audio_file_path, 'rb') as audio_file:
        files = {
            'voice_file': (os.path.basename(audio_file_path), audio_file, 'audio/mpeg')
        }
        
        data = {
            'transcript_file_id': transcript_file_id,
            'note_title': note_title,
            'note_content': note_content,
            'tags': tags
        }
        
        # Отправляем запрос
        start_time = time.time()
        response = requests.post(url, files=files, data=data)
        end_time = time.time()
        
        processing_time = end_time - start_time
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Заметка успешно создана!")
            print(f"⏱️  Общее время обработки: {processing_time:.2f} секунд")
            print(f"🎯 Время транскрибации голоса: {result.get('transcription', {}).get('voice_processing_time', 0):.2f} секунд")
            print(f"📝 Длина заметки: {result.get('note_length', 0)} символов")
            print(f"📚 Длина транскрипции: {result.get('transcription', {}).get('transcript_length', 0)} символов")
            print(f"🎤 Длина голосового сообщения: {result.get('transcription', {}).get('voice_message_length', 0)} символов")
            
            # Показываем содержимое заметки
            note_content = result.get('note', {}).get('content', '')
            if note_content:
                print("\n📄 СОДЕРЖИМОЕ ЗАМЕТКИ:")
                print("-" * 50)
                print(note_content[:500] + "..." if len(note_content) > 500 else note_content)
                print("-" * 50)
            
            return result
        else:
            print(f"❌ Ошибка: {response.status_code}")
            print(f"Ответ: {response.text}")
            return None

def test_list_transcripts():
    """Тестирует получение списка транскрипций пользователя"""
    print("📚 Тестирую получение списка транскрипций...")
    
    url = f"{API_BASE_URL}/api/notes/transcripts/"
    
    response = requests.get(url)
    
    if response.status_code == 200:
        result = response.json()
        print("✅ Список транскрипций получен!")
        print(f"📊 Найдено транскрипций: {len(result.get('transcripts', []))}")
        
        for i, transcript in enumerate(result.get('transcripts', []), 1):
            print(f"  {i}. {transcript.get('original_filename', 'Unknown')}")
            print(f"     ID: {transcript.get('file_id', 'N/A')}")
            print(f"     Размер: {transcript.get('transcript_length', 0)} символов")
            print(f"     Длительность: {transcript.get('total_duration', 0):.1f} секунд")
            print()
        
        return result
    else:
        print(f"❌ Ошибка: {response.status_code}")
        print(f"Ответ: {response.text}")
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
    
    # Тест 1: Создание заметки только из голосового сообщения
    print("\n" + "=" * 60)
    print("🏁 ТЕСТ 1: Создание заметки из голосового сообщения")
    print("=" * 60)
    
    note_title = f"Заметка из {os.path.basename(selected_file)}"
    note_content = "Это дополнительная заметка к голосовому сообщению."
    tags = "голос, заметка, тест"
    
    result1 = test_create_note_from_voice_message(
        selected_file, 
        note_title, 
        note_content, 
        tags
    )
    
    # Тест 2: Получение списка транскрипций
    print("\n" + "=" * 60)
    print("🏁 ТЕСТ 2: Получение списка транскрипций")
    print("=" * 60)
    
    transcripts_result = test_list_transcripts()
    
    # Тест 3: Создание заметки из голосового сообщения и транскрипции
    if transcripts_result and transcripts_result.get('transcripts'):
        print("\n" + "=" * 60)
        print("🏁 ТЕСТ 3: Создание заметки из голосового сообщения и транскрипции")
        print("=" * 60)
        
        # Выбираем первую транскрипцию
        first_transcript = transcripts_result['transcripts'][0]
        transcript_file_id = first_transcript.get('file_id')
        
        if transcript_file_id:
            note_title2 = f"Комбинированная заметка - {os.path.basename(selected_file)}"
            note_content2 = "Это заметка, объединяющая аудиокнигу и голосовое сообщение."
            tags2 = "комбинированная, аудиокнига, голос"
            
            result3 = test_create_note_from_voice_and_transcript(
                selected_file,
                transcript_file_id,
                note_title2,
                note_content2,
                tags2
            )
        else:
            print("⚠️  Не удалось получить ID транскрипции")
    else:
        print("⚠️  Нет доступных транскрипций для комбинированного теста")
    
    # Сохраняем результаты
    timestamp = int(time.time())
    results_file = f"notes_test_{timestamp}.json"
    
    test_data = {
        "timestamp": timestamp,
        "selected_file": selected_file,
        "results": {
            "voice_only": result1,
            "transcripts_list": transcripts_result
        }
    }
    
    with open(results_file, 'w', encoding='utf-8') as f:
        json.dump(test_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n💾 Результаты сохранены в файл: {results_file}")
    
    print("\n" + "=" * 60)
    print("✅ ТЕСТИРОВАНИЕ ЗАВЕРШЕНО")
    print("=" * 60)

if __name__ == "__main__":
    main() 