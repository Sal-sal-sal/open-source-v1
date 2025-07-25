#!/usr/bin/env python3
"""
Тестовый скрипт для проверки API эндпоинта загрузки аудио.
Помогает диагностировать проблемы с загрузкой голосовых сообщений.
"""

import requests
import os
import json
from pathlib import Path

API_BASE_URL = "http://localhost:8000"

def test_audio_upload_endpoint():
    """Тестирует эндпоинт загрузки аудио"""
    print("🎵 Тест API эндпоинта загрузки аудио")
    print("=" * 50)
    
    # Ищем аудио файлы для тестирования
    uploads_dir = Path("uploads")
    test_files = []
    
    if uploads_dir.exists():
        for file in uploads_dir.glob("*"):
            if file.suffix.lower() in ['.mp3', '.wav', '.webm', '.m4a', '.ogg']:
                test_files.append(file)
    
    if not test_files:
        print("❌ Аудио файлы не найдены в директории uploads/")
        print("Создайте тестовый аудио файл для проверки")
        return
    
    print(f"✅ Найдено {len(test_files)} аудио файлов для тестирования:")
    for i, file in enumerate(test_files, 1):
        print(f"  {i}. {file.name} ({file.stat().st_size} bytes)")
    
    # Выбираем файл для тестирования
    if len(test_files) == 1:
        selected_file = test_files[0]
        print(f"✅ Автоматически выбран: {selected_file.name}")
    else:
        while True:
            try:
                choice = input(f"Выберите файл для тестирования (1-{len(test_files)}): ").strip()
                file_index = int(choice) - 1
                if 0 <= file_index < len(test_files):
                    selected_file = test_files[file_index]
                    break
                else:
                    print("❌ Неверный номер")
            except ValueError:
                print("❌ Введите число")
    
    print(f"\n🔄 Тестирую загрузку файла: {selected_file.name}")
    
    # Тестируем загрузку
    try:
        with open(selected_file, 'rb') as f:
            files = {'file': (selected_file.name, f, 'audio/webm')}
            
            response = requests.post(f"{API_BASE_URL}/api/audio/load", files=files)
        
        print(f"📊 Статус ответа: {response.status_code}")
        print(f"📋 Заголовки ответа: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Успешная загрузка!")
            print(f"📄 Результат: {json.dumps(result, indent=2)}")
        else:
            print(f"❌ Ошибка загрузки")
            print(f"📄 Ответ сервера: {response.text}")
            
    except Exception as e:
        print(f"❌ Ошибка при тестировании: {str(e)}")

def test_without_auth():
    """Тестирует эндпоинт без аутентификации"""
    print("\n" + "=" * 50)
    print("🔓 Тест без аутентификации")
    print("=" * 50)
    
    # Создаем простой тестовый файл
    test_content = b"test audio content"
    
    try:
        files = {'file': ('test.webm', test_content, 'audio/webm')}
        response = requests.post(f"{API_BASE_URL}/api/audio/load", files=files)
        
        print(f"📊 Статус ответа: {response.status_code}")
        print(f"📄 Ответ сервера: {response.text}")
        
        if response.status_code == 401:
            print("✅ Правильно требует аутентификацию")
        else:
            print("⚠️  Неожиданный ответ")
            
    except Exception as e:
        print(f"❌ Ошибка: {str(e)}")

def test_invalid_file_type():
    """Тестирует загрузку неподдерживаемого типа файла"""
    print("\n" + "=" * 50)
    print("🚫 Тест неподдерживаемого типа файла")
    print("=" * 50)
    
    # Создаем файл с неподдерживаемым расширением
    test_content = b"test content"
    
    try:
        files = {'file': ('test.txt', test_content, 'text/plain')}
        response = requests.post(f"{API_BASE_URL}/api/audio/load", files=files)
        
        print(f"📊 Статус ответа: {response.status_code}")
        print(f"📄 Ответ сервера: {response.text}")
        
        if response.status_code == 400:
            print("✅ Правильно отклоняет неподдерживаемый тип")
        else:
            print("⚠️  Неожиданный ответ")
            
    except Exception as e:
        print(f"❌ Ошибка: {str(e)}")

def test_large_file():
    """Тестирует загрузку большого файла"""
    print("\n" + "=" * 50)
    print("📏 Тест большого файла")
    print("=" * 50)
    
    # Создаем большой файл (26MB)
    large_content = b"0" * (26 * 1024 * 1024)  # 26MB
    
    try:
        files = {'file': ('large.webm', large_content, 'audio/webm')}
        response = requests.post(f"{API_BASE_URL}/api/audio/load", files=files)
        
        print(f"📊 Статус ответа: {response.status_code}")
        print(f"📄 Ответ сервера: {response.text}")
        
        if response.status_code == 400:
            print("✅ Правильно отклоняет слишком большой файл")
        else:
            print("⚠️  Неожиданный ответ")
            
    except Exception as e:
        print(f"❌ Ошибка: {str(e)}")

def main():
    """Главная функция"""
    print("🎵 Диагностика API загрузки аудио")
    print("=" * 50)
    
    # Проверяем доступность сервера
    try:
        response = requests.get(f"{API_BASE_URL}/docs")
        if response.status_code == 200:
            print("✅ Сервер доступен")
        else:
            print("⚠️  Сервер отвечает, но неожиданный статус")
    except Exception as e:
        print(f"❌ Сервер недоступен: {str(e)}")
        print("Убедитесь, что FastAPI сервер запущен на http://localhost:8000")
        return
    
    # Запускаем тесты
    test_audio_upload_endpoint()
    test_without_auth()
    test_invalid_file_type()
    test_large_file()
    
    print("\n" + "=" * 50)
    print("🏁 Тестирование завершено")
    print("=" * 50)

if __name__ == "__main__":
    main() 