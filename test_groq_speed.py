#!/usr/bin/env python3
"""
Тестовый скрипт для проверки скорости оптимизированной транскрибации Groq.
Сравнивает старую и новую реализацию для демонстрации улучшений.
"""

import os
import time
import requests
import tempfile
from dotenv import load_dotenv
import json

# Загружаем переменные окружения
load_dotenv()

GROQ_API_URL = "https://api.groq.com/openai/v1/audio/transcriptions"
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

def test_groq_speed_old_way(audio_file_path):
    """Тестирует старый способ транскрибации (медленный)"""
    print("🔄 Тестирую старый способ (медленный)...")
    
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}"
    }
    
    start_time = time.time()
    
    with open(audio_file_path, "rb") as audio_file:
        files = {"file": audio_file}
        data = {
            "model": "whisper-large-v3-turbo",
            "response_format": "verbose_json",  # Медленный формат
            "timestamp_granularities": ["word"]  # Дополнительная обработка
        }
        
        response = requests.post(GROQ_API_URL, headers=headers, files=files, data=data)
    
    end_time = time.time()
    processing_time = end_time - start_time
    
    if response.status_code == 200:
        result = response.json()
        transcript = result.get("text", "")
        return {
            "success": True,
            "transcript": transcript,
            "processing_time": processing_time,
            "method": "old_slow"
        }
    else:
        return {
            "success": False,
            "error": f"API Error: {response.status_code} - {response.text}",
            "processing_time": processing_time,
            "method": "old_slow"
        }

def test_groq_speed_new_way(audio_file_path):
    """Тестирует новый способ транскрибации (быстрый)"""
    print("⚡ Тестирую новый способ (быстрый)...")
    
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}"
    }
    
    start_time = time.time()
    
    with open(audio_file_path, "rb") as audio_file:
        files = {"file": audio_file}
        data = {
            "model": "whisper-large-v3-turbo",
            "response_format": "json",  # Быстрый формат
            "prompt": "Transcribe this audio content."  # Улучшает качество
        }
        
        response = requests.post(GROQ_API_URL, headers=headers, files=files, data=data)
    
    end_time = time.time()
    processing_time = end_time - start_time
    
    if response.status_code == 200:
        result = response.json()
        transcript = result.get("text", "")
        return {
            "success": True,
            "transcript": transcript,
            "processing_time": processing_time,
            "method": "new_fast"
        }
    else:
        return {
            "success": False,
            "error": f"API Error: {response.status_code} - {response.text}",
            "processing_time": processing_time,
            "method": "new_fast"
        }

def test_groq_speed_ultra_fast(audio_file_path):
    """Тестирует ультра-быстрый способ транскрибации"""
    print("🚀 Тестирую ультра-быстрый способ...")
    
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}"
    }
    
    start_time = time.time()
    
    with open(audio_file_path, "rb") as audio_file:
        files = {"file": audio_file}
        data = {
            "model": "whisper-large-v3-turbo",
            "response_format": "json",
            "prompt": "Audio transcription."
        }
        
        response = requests.post(GROQ_API_URL, headers=headers, files=files, data=data)
    
    end_time = time.time()
    processing_time = end_time - start_time
    
    if response.status_code == 200:
        result = response.json()
        transcript = result.get("text", "")
        return {
            "success": True,
            "transcript": transcript,
            "processing_time": processing_time,
            "method": "ultra_fast"
        }
    else:
        return {
            "success": False,
            "error": f"API Error: {response.status_code} - {response.text}",
            "processing_time": processing_time,
            "method": "ultra_fast"
        }

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

def get_file_info(file_path):
    """Получает информацию о файле"""
    try:
        size = os.path.getsize(file_path)
        size_mb = size / (1024 * 1024)
        return {
            "path": file_path,
            "size_mb": round(size_mb, 2),
            "filename": os.path.basename(file_path)
        }
    except Exception as e:
        return {"path": file_path, "error": str(e)}

def main():
    """Главная функция"""
    print("🚀 Тест скорости транскрибации Groq")
    print("=" * 50)
    
    if not GROQ_API_KEY:
        print("❌ GROQ_API_KEY не найден в переменных окружения")
        print("Добавьте GROQ_API_KEY=your_key в файл .env")
        return
    
    print("✅ GROQ_API_KEY найден")
    
    # Находим аудио файлы
    audio_files = find_audio_files()
    
    if not audio_files:
        print("❌ Аудио файлы не найдены")
        print("Поместите .mp3, .wav, .webm или .m4a файлы в папку uploads/ или в корневую папку")
        return
    
    print(f"📁 Найдено {len(audio_files)} аудио файлов:")
    for i, file_path in enumerate(audio_files, 1):
        info = get_file_info(file_path)
        print(f"  {i}. {info['filename']} ({info.get('size_mb', 'N/A')} MB)")
    
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
    
    file_info = get_file_info(selected_file)
    print(f"\n🎵 Выбран файл: {file_info['filename']} ({file_info.get('size_mb', 'N/A')} MB)")
    
    # Проверяем подключение к Groq
    print("\n🔍 Проверяем подключение к Groq API...")
    headers = {"Authorization": f"Bearer {GROQ_API_KEY}"}
    try:
        response = requests.get("https://api.groq.com/openai/v1/models", headers=headers)
        if response.status_code == 200:
            print("✅ Подключение к Groq API успешно")
        else:
            print(f"⚠️  Неожиданный ответ: {response.status_code}")
    except Exception as e:
        print(f"❌ Ошибка подключения: {str(e)}")
        return
    
    # Запускаем тесты
    print("\n" + "=" * 50)
    print("🏁 НАЧИНАЕМ ТЕСТИРОВАНИЕ СКОРОСТИ")
    print("=" * 50)
    
    results = []
    
    # Тест 1: Старый способ
    result1 = test_groq_speed_old_way(selected_file)
    results.append(result1)
    
    # Небольшая пауза между тестами
    time.sleep(2)
    
    # Тест 2: Новый способ
    result2 = test_groq_speed_new_way(selected_file)
    results.append(result2)
    
    # Небольшая пауза между тестами
    time.sleep(2)
    
    # Тест 3: Ультра-быстрый способ
    result3 = test_groq_speed_ultra_fast(selected_file)
    results.append(result3)
    
    # Выводим результаты
    print("\n" + "=" * 50)
    print("📊 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ")
    print("=" * 50)
    
    successful_results = [r for r in results if r["success"]]
    
    if not successful_results:
        print("❌ Все тесты завершились с ошибками")
        for result in results:
            print(f"  {result['method']}: {result['error']}")
        return
    
    # Сортируем по времени выполнения
    successful_results.sort(key=lambda x: x["processing_time"])
    
    print(f"📁 Файл: {file_info['filename']}")
    print(f"📏 Размер: {file_info.get('size_mb', 'N/A')} MB")
    print()
    
    for i, result in enumerate(successful_results, 1):
        method_name = {
            "old_slow": "Старый способ (медленный)",
            "new_fast": "Новый способ (быстрый)",
            "ultra_fast": "Ультра-быстрый способ"
        }.get(result["method"], result["method"])
        
        print(f"{i}. {method_name}")
        print(f"   ⏱️  Время: {result['processing_time']:.2f} секунд")
        print(f"   📝 Длина текста: {len(result['transcript'])} символов")
        print()
    
    # Показываем улучшение
    if len(successful_results) >= 2:
        fastest = successful_results[0]
        slowest = successful_results[-1]
        improvement = (slowest["processing_time"] - fastest["processing_time"]) / slowest["processing_time"] * 100
        
        print("🎯 АНАЛИЗ ПРОИЗВОДИТЕЛЬНОСТИ:")
        print(f"   Самый быстрый: {fastest['processing_time']:.2f}с")
        print(f"   Самый медленный: {slowest['processing_time']:.2f}с")
        print(f"   Улучшение: {improvement:.1f}%")
        
        if improvement > 20:
            print("   🚀 Отличное улучшение производительности!")
        elif improvement > 10:
            print("   ✅ Хорошее улучшение производительности")
        else:
            print("   ⚠️  Небольшое улучшение")
    
    # Сохраняем результаты
    timestamp = int(time.time())
    results_file = f"groq_speed_test_{timestamp}.json"
    
    test_data = {
        "timestamp": timestamp,
        "file_info": file_info,
        "results": results,
        "summary": {
            "total_tests": len(results),
            "successful_tests": len(successful_results),
            "fastest_method": successful_results[0]["method"] if successful_results else None,
            "fastest_time": successful_results[0]["processing_time"] if successful_results else None
        }
    }
    
    with open(results_file, 'w', encoding='utf-8') as f:
        json.dump(test_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n💾 Результаты сохранены в файл: {results_file}")
    
    # Показываем пример транскрипции
    if successful_results:
        best_result = successful_results[0]
        print(f"\n📝 ПРИМЕР ТРАНСКРИПЦИИ (лучший результат):")
        print("-" * 30)
        transcript = best_result["transcript"]
        if len(transcript) > 200:
            print(transcript[:200] + "...")
        else:
            print(transcript)
        print("-" * 30)

if __name__ == "__main__":
    main() 