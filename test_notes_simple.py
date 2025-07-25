#!/usr/bin/env python3
"""
Простой тестовый скрипт для проверки создания заметок из голосовых сообщений.
Тестирует базовую функциональность без аутентификации.
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

def test_groq_transcription_direct(audio_file_path):
    """Тестирует прямую транскрибацию через Groq API"""
    print(f"🎤 Тестирую прямую транскрибацию Groq...")
    print(f"📁 Файл: {os.path.basename(audio_file_path)}")
    
    if not API_KEY:
        print("❌ GROQ_API_KEY не найден в переменных окружения")
        return None
    
    GROQ_API_URL = "https://api.groq.com/openai/v1/audio/transcriptions"
    
    headers = {
        "Authorization": f"Bearer {API_KEY}"
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
            "method": "direct_groq"
        }
    else:
        return {
            "success": False,
            "error": f"API Error: {response.status_code} - {response.text}",
            "processing_time": processing_time,
            "method": "direct_groq"
        }

def test_groq_speed_comparison(audio_file_path):
    """Сравнивает разные способы транскрибации Groq"""
    print(f"⚡ Тестирую сравнение скорости Groq...")
    print(f"📁 Файл: {os.path.basename(audio_file_path)}")
    
    if not API_KEY:
        print("❌ GROQ_API_KEY не найден в переменных окружения")
        return None
    
    GROQ_API_URL = "https://api.groq.com/openai/v1/audio/transcriptions"
    headers = {"Authorization": f"Bearer {API_KEY}"}
    
    results = []
    
    # Тест 1: Медленный способ (verbose_json)
    print("🔄 Тест 1: Медленный способ (verbose_json)...")
    start_time = time.time()
    
    with open(audio_file_path, "rb") as audio_file:
        files = {"file": audio_file}
        data = {
            "model": "whisper-large-v3-turbo",
            "response_format": "verbose_json",
            "timestamp_granularities": ["word"]
        }
        response = requests.post(GROQ_API_URL, headers=headers, files=files, data=data)
    
    end_time = time.time()
    slow_time = end_time - start_time
    
    if response.status_code == 200:
        result = response.json()
        transcript = result.get("text", "")
        results.append({
            "method": "slow_verbose_json",
            "processing_time": slow_time,
            "transcript_length": len(transcript),
            "success": True
        })
        print(f"✅ Медленный способ: {slow_time:.2f}с")
    else:
        print(f"❌ Медленный способ: {response.status_code}")
    
    time.sleep(2)  # Пауза между тестами
    
    # Тест 2: Быстрый способ (json)
    print("⚡ Тест 2: Быстрый способ (json)...")
    start_time = time.time()
    
    with open(audio_file_path, "rb") as audio_file:
        files = {"file": audio_file}
        data = {
            "model": "whisper-large-v3-turbo",
            "response_format": "json",
            "prompt": "Transcribe this audio content."
        }
        response = requests.post(GROQ_API_URL, headers=headers, files=files, data=data)
    
    end_time = time.time()
    fast_time = end_time - start_time
    
    if response.status_code == 200:
        result = response.json()
        transcript = result.get("text", "")
        results.append({
            "method": "fast_json",
            "processing_time": fast_time,
            "transcript_length": len(transcript),
            "success": True
        })
        print(f"✅ Быстрый способ: {fast_time:.2f}с")
    else:
        print(f"❌ Быстрый способ: {response.status_code}")
    
    time.sleep(2)  # Пауза между тестами
    
    # Тест 3: Ультра-быстрый способ (минимальные параметры)
    print("🚀 Тест 3: Ультра-быстрый способ...")
    start_time = time.time()
    
    with open(audio_file_path, "rb") as audio_file:
        files = {"file": audio_file}
        data = {
            "model": "whisper-large-v3-turbo",
            "response_format": "json"
        }
        response = requests.post(GROQ_API_URL, headers=headers, files=files, data=data)
    
    end_time = time.time()
    ultra_time = end_time - start_time
    
    if response.status_code == 200:
        result = response.json()
        transcript = result.get("text", "")
        results.append({
            "method": "ultra_fast",
            "processing_time": ultra_time,
            "transcript_length": len(transcript),
            "success": True
        })
        print(f"✅ Ультра-быстрый способ: {ultra_time:.2f}с")
    else:
        print(f"❌ Ультра-быстрый способ: {response.status_code}")
    
    return results

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
    print("🎵 Простой тест транскрибации Groq")
    print("=" * 50)
    
    if not API_KEY:
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
    
    # Тест 1: Прямая транскрибация
    print("\n" + "=" * 50)
    print("🏁 ТЕСТ 1: Прямая транскрибация Groq")
    print("=" * 50)
    
    result1 = test_groq_transcription_direct(selected_file)
    
    if result1 and result1["success"]:
        print("✅ Транскрибация успешна!")
        print(f"⏱️  Время: {result1['processing_time']:.2f} секунд")
        print(f"📝 Длина текста: {len(result1['transcript'])} символов")
        
        # Показываем часть транскрипции
        transcript = result1['transcript']
        if len(transcript) > 200:
            print(f"📄 Текст: {transcript[:200]}...")
        else:
            print(f"📄 Текст: {transcript}")
    else:
        print("❌ Ошибка транскрибации")
        if result1:
            print(f"Ошибка: {result1.get('error', 'Unknown error')}")
    
    # Тест 2: Сравнение скорости
    print("\n" + "=" * 50)
    print("🏁 ТЕСТ 2: Сравнение скорости методов")
    print("=" * 50)
    
    results2 = test_groq_speed_comparison(selected_file)
    
    if results2:
        successful_results = [r for r in results2 if r["success"]]
        
        if successful_results:
            print("\n📊 РЕЗУЛЬТАТЫ СРАВНЕНИЯ:")
            print("-" * 30)
            
            # Сортируем по времени
            successful_results.sort(key=lambda x: x["processing_time"])
            
            for i, result in enumerate(successful_results, 1):
                method_name = {
                    "slow_verbose_json": "Медленный (verbose_json)",
                    "fast_json": "Быстрый (json + prompt)",
                    "ultra_fast": "Ультра-быстрый (json)"
                }.get(result["method"], result["method"])
                
                print(f"{i}. {method_name}")
                print(f"   ⏱️  Время: {result['processing_time']:.2f} секунд")
                print(f"   📝 Длина: {result['transcript_length']} символов")
                print()
            
            # Показываем улучшение
            if len(successful_results) >= 2:
                fastest = successful_results[0]
                slowest = successful_results[-1]
                improvement = (slowest["processing_time"] - fastest["processing_time"]) / slowest["processing_time"] * 100
                
                print("🎯 АНАЛИЗ ПРОИЗВОДИТЕЛЬНОСТИ:")
                print(f"   Самый быстрый: {fastest['processing_time']:.2f}с ({fastest['method']})")
                print(f"   Самый медленный: {slowest['processing_time']:.2f}с ({slowest['method']})")
                print(f"   Улучшение: {improvement:.1f}%")
                
                if improvement > 20:
                    print("   🚀 Отличное улучшение производительности!")
                elif improvement > 10:
                    print("   ✅ Хорошее улучшение производительности")
                else:
                    print("   ⚠️  Небольшое улучшение")
        else:
            print("❌ Все тесты завершились с ошибками")
    
    # Сохраняем результаты
    timestamp = int(time.time())
    results_file = f"groq_simple_test_{timestamp}.json"
    
    test_data = {
        "timestamp": timestamp,
        "selected_file": selected_file,
        "results": {
            "direct_transcription": result1,
            "speed_comparison": results2
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