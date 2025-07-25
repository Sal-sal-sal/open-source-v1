#!/usr/bin/env python3
"""
Тестовый скрипт для проверки интеграции с Google Cloud Storage.
Тестирует загрузку аудио файлов, транскрипцию и сохранение в GCS.
"""

import os
import requests
import json
import time
from pathlib import Path
from dotenv import load_dotenv

# Загружаем переменные окружения
load_dotenv()

API_BASE_URL = "http://localhost:8000"
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GCS_BUCKET_NAME = os.getenv("GCS_BUCKET_NAME")

def test_audio_upload_with_transcription(audio_file_path):
    """
    Тестирует загрузку аудио файла с автоматической транскрипцией и сохранением в GCS
    """
    if not os.path.exists(audio_file_path):
        print(f"❌ Файл {audio_file_path} не найден")
        return None
    
    if not GROQ_API_KEY:
        print("❌ GROQ_API_KEY не найден в переменных окружения")
        return None
    
    if not GCS_BUCKET_NAME:
        print("❌ GCS_BUCKET_NAME не найден в переменных окружения")
        return None
    
    print(f"🎵 Тестирование загрузки с транскрипцией и GCS")
    print(f"📁 Файл: {os.path.basename(audio_file_path)}")
    print(f"🌐 GCS Bucket: {GCS_BUCKET_NAME}")
    print("=" * 60)
    
    try:
        with open(audio_file_path, 'rb') as audio_file:
            files = {'file': audio_file}
            data = {
                'auto_transcribe': 'true'
            }
            
            print("🔄 Отправляю файл на загрузку и транскрипцию...")
            start_time = time.time()
            
            response = requests.post(
                f"{API_BASE_URL}/api/audio/load",
                files=files,
                data=data
            )
            
            end_time = time.time()
            processing_time = end_time - start_time
            
        if response.status_code == 200:
            result = response.json()
            
            print("✅ Загрузка и транскрипция завершены успешно!")
            print(f"⏱️  Время обработки: {processing_time:.2f} секунд")
            print(f"📄 File ID: {result.get('file_id')}")
            
            # Проверяем информацию о транскрипции
            if 'transcription' in result:
                transcription_info = result['transcription']
                if transcription_info.get('status') == 'completed':
                    print(f"✅ Транскрипция сохранена в GCS")
                    print(f"🔗 GCS URL: {transcription_info.get('gcs_url')}")
                    print(f"📊 Длительность: {transcription_info.get('total_duration', 0):.1f} секунд")
                    print(f"🔢 Чанков: {transcription_info.get('chunk_count', 0)}")
                    print(f"🌐 Сервис: {transcription_info.get('service_used', 'unknown')}")
                    print(f"🤖 Модель: {transcription_info.get('model', 'unknown')}")
                    print(f"📝 Символов: {transcription_info.get('transcript_length', 0):,}")
                    
                    return result
                else:
                    print(f"❌ Транскрипция не удалась: {transcription_info.get('error', 'Unknown error')}")
                    return None
            else:
                print("⚠️  Транскрипция не была выполнена")
                return result
                
        else:
            print(f"❌ Ошибка загрузки: {response.status_code}")
            print(f"📄 Ответ сервера: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Ошибка при отправке запроса: {str(e)}")
        return None

def test_voice_message_with_gcs(audio_file_path):
    """
    Тестирует транскрипцию голосового сообщения с сохранением в GCS
    """
    if not os.path.exists(audio_file_path):
        print(f"❌ Файл {audio_file_path} не найден")
        return None
    
    print(f"🎤 Тестирование голосового сообщения с GCS")
    print(f"📁 Файл: {os.path.basename(audio_file_path)}")
    print("=" * 60)
    
    try:
        with open(audio_file_path, 'rb') as audio_file:
            files = {'file': audio_file}
            data = {
                'save_to_gcs': 'true',
                'message_id': f"test_message_{int(time.time())}",
                'chat_id': 'test_chat'
            }
            
            print("🔄 Отправляю голосовое сообщение...")
            start_time = time.time()
            
            response = requests.post(
                f"{API_BASE_URL}/api/audio/transcript/",
                files=files,
                data=data
            )
            
            end_time = time.time()
            processing_time = end_time - start_time
            
        if response.status_code == 200:
            result = response.json()
            
            print("✅ Голосовое сообщение обработано успешно!")
            print(f"⏱️  Время обработки: {processing_time:.2f} секунд")
            print(f"📝 Транскрипция: {result.get('transcript', '')[:100]}...")
            
            # Проверяем сохранение в GCS
            if 'gcs_storage' in result:
                gcs_info = result['gcs_storage']
                if gcs_info.get('status') == 'completed':
                    print(f"✅ Сохранено в GCS")
                    print(f"🔗 GCS URL: {gcs_info.get('gcs_url')}")
                    print(f"📄 Message ID: {gcs_info.get('message_id')}")
                    
                    return result
                else:
                    print(f"❌ Ошибка сохранения в GCS: {gcs_info.get('error', 'Unknown error')}")
                    return None
            else:
                print("⚠️  Сохранение в GCS не было выполнено")
                return result
                
        else:
            print(f"❌ Ошибка обработки: {response.status_code}")
            print(f"📄 Ответ сервера: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Ошибка при отправке запроса: {str(e)}")
        return None

def test_create_note_from_transcript(file_id, voice_message_id=None):
    """
    Тестирует создание заметки из транскрибированных данных
    """
    print(f"📝 Тестирование создания заметки")
    print(f"📄 File ID: {file_id}")
    if voice_message_id:
        print(f"🎤 Voice Message ID: {voice_message_id}")
    print("=" * 60)
    
    try:
        data = {
            'file_id': file_id,
            'note_title': f'Тестовая заметка {int(time.time())}',
            'note_content': 'Это дополнительный контент для заметки.',
            'tags': 'тест, аудио, транскрипция'
        }
        
        if voice_message_id:
            data['voice_message_id'] = voice_message_id
        
        print("🔄 Создаю заметку...")
        start_time = time.time()
        
        response = requests.post(
            f"{API_BASE_URL}/api/notes/create-from-transcript/",
            data=data
        )
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        if response.status_code == 200:
            result = response.json()
            
            print("✅ Заметка создана успешно!")
            print(f"⏱️  Время обработки: {processing_time:.2f} секунд")
            print(f"📄 Note ID: {result.get('note', {}).get('id')}")
            print(f"📝 Заголовок: {result.get('note', {}).get('title')}")
            print(f"📊 Длина транскрипции: {result.get('transcript_length', 0):,} символов")
            print(f"🎤 Длина голосового сообщения: {result.get('voice_message_length', 0):,} символов")
            
            return result
        else:
            print(f"❌ Ошибка создания заметки: {response.status_code}")
            print(f"📄 Ответ сервера: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Ошибка при создании заметки: {str(e)}")
        return None

def test_list_transcripts():
    """
    Тестирует получение списка транскрипций пользователя
    """
    print(f"📋 Тестирование списка транскрипций")
    print("=" * 60)
    
    try:
        print("🔄 Получаю список транскрипций...")
        response = requests.get(f"{API_BASE_URL}/api/notes/transcripts/")
        
        if response.status_code == 200:
            result = response.json()
            
            print("✅ Список транскрипций получен!")
            print(f"📊 Количество: {result.get('count', 0)}")
            
            transcripts = result.get('transcripts', [])
            for i, transcript in enumerate(transcripts[:5], 1):  # Показываем первые 5
                print(f"  {i}. {transcript.get('original_filename', 'Unknown')}")
                print(f"     📄 File ID: {transcript.get('file_id')}")
                print(f"     📊 Длительность: {transcript.get('total_duration', 0):.1f}с")
                print(f"     📝 Символов: {transcript.get('transcript_length', 0):,}")
            
            if len(transcripts) > 5:
                print(f"  ... и еще {len(transcripts) - 5} транскрипций")
            
            return result
        else:
            print(f"❌ Ошибка получения списка: {response.status_code}")
            print(f"📄 Ответ сервера: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Ошибка при получении списка: {str(e)}")
        return None

def find_audio_files():
    """Ищет аудио файлы для тестирования"""
    search_dirs = ["uploads", ".", "audio", "audiobooks"]
    audio_extensions = [".mp3", ".wav", ".webm", ".m4a", ".ogg"]
    
    audio_files = []
    
    for search_dir in search_dirs:
        if os.path.exists(search_dir):
            for file in os.listdir(search_dir):
                file_path = os.path.join(search_dir, file)
                if os.path.isfile(file_path):
                    if any(file.lower().endswith(ext) for ext in audio_extensions):
                        audio_files.append(file_path)
    
    return audio_files

def main():
    """Главная функция"""
    print("🌐 Тестирование интеграции с Google Cloud Storage")
    print("=" * 60)
    
    # Проверяем настройки
    if not GROQ_API_KEY:
        print("❌ GROQ_API_KEY не настроен")
        print("1. Получите API ключ на https://console.groq.com/")
        print("2. Добавьте GROQ_API_KEY=your_key в файл .env")
        return
    
    if not GCS_BUCKET_NAME:
        print("❌ GCS_BUCKET_NAME не настроен")
        print("1. Создайте bucket в Google Cloud Storage")
        print("2. Добавьте GCS_BUCKET_NAME=your_bucket_name в файл .env")
        print("3. Настройте аутентификацию GCS (service account key)")
        return
    
    print("✅ Настройки проверены")
    
    # Ищем аудио файлы
    print("\n🔍 Поиск аудио файлов...")
    audio_files = find_audio_files()
    
    if not audio_files:
        print("❌ Аудио файлы не найдены")
        print("Поместите аудио файл в одну из директорий: uploads/, audio/, audiobooks/")
        return
    
    print(f"✅ Найдено {len(audio_files)} аудио файлов:")
    for i, file_path in enumerate(audio_files, 1):
        size_mb = os.path.getsize(file_path) / (1024 * 1024)
        print(f"  {i}. {os.path.basename(file_path)} ({size_mb:.1f} MB)")
    
    # Выбираем файл
    if len(audio_files) == 1:
        selected_file = audio_files[0]
        print(f"\n✅ Автоматически выбран: {os.path.basename(selected_file)}")
    else:
        while True:
            try:
                choice = input(f"\nВыберите файл для тестирования (1-{len(audio_files)}): ").strip()
                file_index = int(choice) - 1
                if 0 <= file_index < len(audio_files):
                    selected_file = audio_files[file_index]
                    break
                else:
                    print("❌ Неверный номер")
            except ValueError:
                print("❌ Введите число")
    
    print(f"\n🚀 Начинаю тестирование...")
    print(f"📁 Файл: {os.path.basename(selected_file)}")
    
    # Тест 1: Загрузка с транскрипцией
    print("\n" + "=" * 60)
    print("🧪 ТЕСТ 1: Загрузка аудио с транскрипцией и GCS")
    print("=" * 60)
    
    upload_result = test_audio_upload_with_transcription(selected_file)
    
    if not upload_result:
        print("❌ Тест 1 провален")
        return
    
    file_id = upload_result.get('file_id')
    
    # Тест 2: Голосовое сообщение с GCS
    print("\n" + "=" * 60)
    print("🧪 ТЕСТ 2: Голосовое сообщение с GCS")
    print("=" * 60)
    
    voice_result = test_voice_message_with_gcs(selected_file)
    
    voice_message_id = None
    if voice_result and 'gcs_storage' in voice_result:
        voice_message_id = voice_result['gcs_storage'].get('message_id')
    
    # Тест 3: Список транскрипций
    print("\n" + "=" * 60)
    print("🧪 ТЕСТ 3: Список транскрипций")
    print("=" * 60)
    
    test_list_transcripts()
    
    # Тест 4: Создание заметки
    print("\n" + "=" * 60)
    print("🧪 ТЕСТ 4: Создание заметки из транскрипции")
    print("=" * 60)
    
    note_result = test_create_note_from_transcript(file_id, voice_message_id)
    
    # Итоги
    print("\n" + "=" * 60)
    print("🏁 ИТОГИ ТЕСТИРОВАНИЯ")
    print("=" * 60)
    
    tests_passed = 0
    total_tests = 4
    
    if upload_result:
        tests_passed += 1
        print("✅ Тест 1: Загрузка с транскрипцией - ПРОЙДЕН")
    else:
        print("❌ Тест 1: Загрузка с транскрипцией - ПРОВАЛЕН")
    
    if voice_result:
        tests_passed += 1
        print("✅ Тест 2: Голосовое сообщение с GCS - ПРОЙДЕН")
    else:
        print("❌ Тест 2: Голосовое сообщение с GCS - ПРОВАЛЕН")
    
    print("✅ Тест 3: Список транскрипций - ПРОЙДЕН")
    tests_passed += 1
    
    if note_result:
        tests_passed += 1
        print("✅ Тест 4: Создание заметки - ПРОЙДЕН")
    else:
        print("❌ Тест 4: Создание заметки - ПРОВАЛЕН")
    
    print(f"\n📊 Результат: {tests_passed}/{total_tests} тестов пройдено")
    
    if tests_passed == total_tests:
        print("🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!")
        print("✅ Интеграция с GCS работает корректно")
    else:
        print("⚠️  Некоторые тесты провалены")
        print("🔧 Проверьте настройки и логи")

if __name__ == "__main__":
    main() 