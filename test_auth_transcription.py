#!/usr/bin/env python3
"""
Тестовый скрипт для проверки транскрибации с аутентификацией.
Проверяет работу endpoint /api/audio/transcript/ с токеном.
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

def test_auth_transcription(audio_file_path, auth_token=None):
    """Тестирует транскрибацию с аутентификацией"""
    print(f"🎤 Тестирую транскрибацию с аутентификацией...")
    print(f"📁 Файл: {os.path.basename(audio_file_path)}")
    
    url = f"{API_BASE_URL}/api/audio/transcript/"
    
    # Подготавливаем заголовки
    headers = {}
    if auth_token:
        headers["Authorization"] = f"Bearer {auth_token}"
        print("✅ Используется токен аутентификации")
    else:
        print("⚠️  Токен аутентификации не предоставлен")
    
    # Подготавливаем данные для отправки
    with open(audio_file_path, 'rb') as audio_file:
        files = {
            'file': (os.path.basename(audio_file_path), audio_file, 'audio/webm')
        }
        
        data = {
            'service': 'groq'  # Принудительно используем Groq
        }
        
        # Отправляем запрос
        start_time = time.time()
        response = requests.post(url, files=files, data=data, headers=headers)
        end_time = time.time()
        
        processing_time = end_time - start_time
        
        print(f"⏱️  Время запроса: {processing_time:.2f} секунд")
        print(f"📊 Статус ответа: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Транскрибация успешна!")
            print(f"📝 Длина транскрипции: {len(result.get('transcript', ''))} символов")
            print(f"🎯 Использованный сервис: {result.get('service_used', 'unknown')}")
            
            # Показываем часть транскрипции
            transcript = result.get('transcript', '')
            if transcript:
                print(f"📄 Текст: {transcript[:200]}..." if len(transcript) > 200 else f"📄 Текст: {transcript}")
            
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

def test_without_auth(audio_file_path):
    """Тестирует транскрибацию без аутентификации"""
    print("\n" + "=" * 50)
    print("🏁 ТЕСТ 1: Без аутентификации")
    print("=" * 50)
    
    return test_auth_transcription(audio_file_path, auth_token=None)

def test_with_auth(audio_file_path, auth_token):
    """Тестирует транскрибацию с аутентификацией"""
    print("\n" + "=" * 50)
    print("🏁 ТЕСТ 2: С аутентификацией")
    print("=" * 50)
    
    return test_auth_transcription(audio_file_path, auth_token=auth_token)

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
    print("🎵 Тест транскрибации с аутентификацией")
    print("=" * 50)
    
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
    auth_token = input("\nВведите токен аутентификации (или нажмите Enter для пропуска): ").strip()
    
    # Тест 1: Без аутентификации
    result1 = test_without_auth(selected_file)
    
    # Тест 2: С аутентификацией (если предоставлен токен)
    result2 = None
    if auth_token:
        result2 = test_with_auth(selected_file, auth_token)
    else:
        print("\n" + "=" * 50)
        print("🏁 ТЕСТ 2: Пропущен (токен не предоставлен)")
        print("=" * 50)
        print("💡 Для тестирования с аутентификацией предоставьте валидный токен")
    
    # Анализ результатов
    print("\n" + "=" * 50)
    print("📊 АНАЛИЗ РЕЗУЛЬТАТОВ")
    print("=" * 50)
    
    if result1:
        print("✅ Тест без аутентификации: УСПЕШЕН")
        print("⚠️  Это означает, что endpoint не защищен аутентификацией")
    else:
        print("❌ Тест без аутентификации: ПРОВАЛЕН")
        print("✅ Это означает, что endpoint правильно защищен")
    
    if result2:
        print("✅ Тест с аутентификацией: УСПЕШЕН")
        print("🎯 Endpoint работает корректно с аутентификацией")
    elif auth_token:
        print("❌ Тест с аутентификацией: ПРОВАЛЕН")
        print("💡 Возможно, токен недействителен или устарел")
    
    # Сохраняем результаты
    timestamp = int(time.time())
    results_file = f"auth_transcription_test_{timestamp}.json"
    
    test_data = {
        "timestamp": timestamp,
        "selected_file": selected_file,
        "auth_token_provided": bool(auth_token),
        "results": {
            "without_auth": result1,
            "with_auth": result2
        }
    }
    
    with open(results_file, 'w', encoding='utf-8') as f:
        json.dump(test_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n💾 Результаты сохранены в файл: {results_file}")
    
    print("\n" + "=" * 50)
    print("✅ ТЕСТИРОВАНИЕ ЗАВЕРШЕНО")
    print("=" * 50)

if __name__ == "__main__":
    main() 