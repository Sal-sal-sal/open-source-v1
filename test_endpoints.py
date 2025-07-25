#!/usr/bin/env python3
"""
Простой тест для проверки доступности endpoints после исправления конфликта роутеров.
"""

import requests
import json

API_BASE_URL = "http://localhost:8000"

def test_endpoint_availability():
    """Тестирует доступность основных endpoints"""
    print("🔍 Тестирую доступность endpoints...")
    print("=" * 50)
    
    endpoints_to_test = [
        "/docs",  # Swagger UI
        "/api/notes/",  # Structured notes
        "/api/voice-notes/create-from-voice-message/",  # Voice notes
        "/api/audio/transcript/",  # Audio transcription
    ]
    
    for endpoint in endpoints_to_test:
        try:
            url = f"{API_BASE_URL}{endpoint}"
            print(f"📡 Тестирую: {endpoint}")
            
            if endpoint == "/docs":
                # GET request для docs
                response = requests.get(url)
            else:
                # POST request для API endpoints (должен вернуть 401 без токена)
                response = requests.post(url)
            
            print(f"   Статус: {response.status_code}")
            
            if response.status_code == 200:
                print("   ✅ Endpoint доступен")
            elif response.status_code == 401:
                print("   ✅ Endpoint доступен (требует аутентификации)")
            elif response.status_code == 405:
                print("   ❌ Method Not Allowed - проблема с методом")
            elif response.status_code == 404:
                print("   ❌ Not Found - endpoint не найден")
            else:
                print(f"   ⚠️  Неожиданный статус: {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Ошибка подключения: {str(e)}")
        
        print()
    
    print("=" * 50)
    print("✅ Тестирование завершено")

def test_router_registration():
    """Проверяет, что роутеры правильно зарегистрированы"""
    print("🔧 Проверяю регистрацию роутеров...")
    print("=" * 50)
    
    try:
        # Получаем OpenAPI схему
        response = requests.get(f"{API_BASE_URL}/openapi.json")
        if response.status_code == 200:
            openapi_spec = response.json()
            
            # Проверяем пути
            paths = openapi_spec.get("paths", {})
            
            # Ищем пути для заметок
            notes_paths = [path for path in paths.keys() if "notes" in path]
            voice_notes_paths = [path for path in paths.keys() if "voice-notes" in path]
            
            print(f"📄 Найдено путей с 'notes': {len(notes_paths)}")
            for path in notes_paths:
                print(f"   - {path}")
            
            print(f"🎤 Найдено путей с 'voice-notes': {len(voice_notes_paths)}")
            for path in voice_notes_paths:
                print(f"   - {path}")
            
            # Проверяем конкретные endpoints
            required_endpoints = [
                "/api/notes/",
                "/api/voice-notes/create-from-voice-message/",
                "/api/voice-notes/create-from-voice-and-transcript/",
                "/api/voice-notes/create-from-transcript/",
            ]
            
            print("\n🔍 Проверяю обязательные endpoints:")
            for endpoint in required_endpoints:
                if endpoint in paths:
                    print(f"   ✅ {endpoint}")
                else:
                    print(f"   ❌ {endpoint} - НЕ НАЙДЕН")
            
        else:
            print("❌ Не удалось получить OpenAPI схему")
            
    except Exception as e:
        print(f"❌ Ошибка при проверке роутеров: {str(e)}")
    
    print("=" * 50)

def main():
    """Главная функция"""
    print("🚀 Тест доступности endpoints после исправления конфликта роутеров")
    print("=" * 60)
    
    # Проверяем доступность сервера
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
    
    print()
    
    # Тестируем endpoints
    test_endpoint_availability()
    
    # Проверяем регистрацию роутеров
    test_router_registration()
    
    print("\n" + "=" * 60)
    print("✅ ТЕСТИРОВАНИЕ ЗАВЕРШЕНО")
    print("=" * 60)
    
    print("\n💡 Если все endpoints показывают ✅, то конфликт роутеров исправлен!")
    print("💡 Теперь можно тестировать создание заметок из голосовых сообщений.")

if __name__ == "__main__":
    main() 