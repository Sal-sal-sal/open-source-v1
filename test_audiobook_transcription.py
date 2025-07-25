#!/usr/bin/env python3
"""
Скрипт для тестирования транскрипции аудиокниг с Distil-Whisper.
Оптимизирован для длинных аудио файлов с разбивкой на чанки.
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

def test_audiobook_transcription(audio_file_path, chunk_size=30, overlap=2):
    """
    Тестирует транскрипцию аудиокниги через API
    
    Args:
        audio_file_path: путь к аудио файлу
        chunk_size: размер чанка в секундах
        overlap: перекрытие между чанками
    """
    if not os.path.exists(audio_file_path):
        print(f"❌ Файл {audio_file_path} не найден")
        return None
    
    if not GROQ_API_KEY:
        print("❌ GROQ_API_KEY не найден в переменных окружения")
        print("Добавьте GROQ_API_KEY=your_key в файл .env")
        return None
    
    print(f"🎵 Тестирование транскрипции аудиокниги")
    print(f"📁 Файл: {os.path.basename(audio_file_path)}")
    print(f"⚙️  Чанк: {chunk_size}с, Перекрытие: {overlap}с")
    print("=" * 60)
    
    try:
        with open(audio_file_path, 'rb') as audio_file:
            files = {'file': audio_file}
            data = {
                'chunk_size': chunk_size,
                'overlap': overlap,
                'language': 'auto',
                'task': 'transcribe',
                'service': 'groq'
            }
            
            print("🔄 Отправляю файл на транскрипцию...")
            start_time = time.time()
            
            response = requests.post(
                f"{API_BASE_URL}/api/audio/transcribe-audiobook/",
                files=files,
                data=data
            )
            
            end_time = time.time()
            processing_time = end_time - start_time
            
        if response.status_code == 200:
            result = response.json()
            
            print("✅ Транскрипция завершена успешно!")
            print(f"⏱️  Время обработки: {processing_time:.2f} секунд")
            print(f"📊 Длительность аудио: {result.get('total_duration', 0):.1f} секунд")
            print(f"🔢 Количество чанков: {result.get('chunk_count', 0)}")
            print(f"🌐 Сервис: {result.get('service_used', 'unknown')}")
            print(f"🤖 Модель: {result.get('model', 'unknown')}")
            
            # Показываем первые 500 символов транскрипции
            transcript = result.get('transcript', '')
            print(f"\n📝 ТРАНСКРИПЦИЯ (первые 500 символов):")
            print("-" * 50)
            print(transcript[:500] + ("..." if len(transcript) > 500 else ""))
            print("-" * 50)
            
            # Сохраняем полный результат
            output_file = f"audiobook_transcript_{Path(audio_file_path).stem}.json"
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(result, f, ensure_ascii=False, indent=2)
            
            print(f"\n💾 Полный результат сохранен в: {output_file}")
            
            # Сохраняем только текст
            text_file = f"audiobook_text_{Path(audio_file_path).stem}.txt"
            with open(text_file, 'w', encoding='utf-8') as f:
                f.write(transcript)
            
            print(f"📄 Текст сохранен в: {text_file}")
            
            return result
            
        else:
            print(f"❌ Ошибка транскрипции: {response.status_code}")
            print(f"📄 Ответ сервера: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Ошибка при отправке запроса: {str(e)}")
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

def get_file_size_mb(file_path):
    """Получает размер файла в МБ"""
    size_bytes = os.path.getsize(file_path)
    return size_bytes / (1024 * 1024)

def main():
    """Главная функция"""
    print("🎵 Тестирование транскрипции аудиокниг с Distil-Whisper")
    print("=" * 60)
    
    # Проверяем API ключ
    if not GROQ_API_KEY:
        print("❌ GROQ_API_KEY не настроен")
        print("1. Получите API ключ на https://console.groq.com/")
        print("2. Добавьте GROQ_API_KEY=your_key в файл .env")
        return
    
    print("✅ GROQ_API_KEY найден")
    
    # Ищем аудио файлы
    print("\n🔍 Поиск аудио файлов...")
    audio_files = find_audio_files()
    
    if not audio_files:
        print("❌ Аудио файлы не найдены")
        print("Поместите аудио файл в одну из директорий: uploads/, audio/, audiobooks/")
        return
    
    print(f"✅ Найдено {len(audio_files)} аудио файлов:")
    for i, file_path in enumerate(audio_files, 1):
        size_mb = get_file_size_mb(file_path)
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
    
    # Настройки транскрипции
    print(f"\n⚙️  Настройки транскрипции:")
    
    # Размер чанка
    while True:
        try:
            chunk_input = input("Размер чанка в секундах (по умолчанию 30): ").strip()
            chunk_size = int(chunk_input) if chunk_input else 30
            if 10 <= chunk_size <= 300:
                break
            else:
                print("❌ Размер чанка должен быть от 10 до 300 секунд")
        except ValueError:
            print("❌ Введите корректное число")
    
    # Перекрытие
    while True:
        try:
            overlap_input = input("Перекрытие между чанками в секундах (по умолчанию 2): ").strip()
            overlap = int(overlap_input) if overlap_input else 2
            if 0 <= overlap < chunk_size:
                break
            else:
                print(f"❌ Перекрытие должно быть от 0 до {chunk_size-1}")
        except ValueError:
            print("❌ Введите корректное число")
    
    print(f"\n🚀 Начинаю транскрипцию...")
    print(f"📁 Файл: {os.path.basename(selected_file)}")
    print(f"⚙️  Чанк: {chunk_size}с, Перекрытие: {overlap}с")
    
    # Запускаем транскрипцию
    result = test_audiobook_transcription(selected_file, chunk_size, overlap)
    
    if result:
        print("\n" + "=" * 60)
        print("🎉 ТЕСТИРОВАНИЕ ЗАВЕРШЕНО УСПЕШНО!")
        print("=" * 60)
        
        # Статистика
        transcript_length = len(result.get('transcript', ''))
        word_count = len(result.get('transcript', '').split())
        
        print(f"📊 Статистика:")
        print(f"  • Символов в транскрипции: {transcript_length:,}")
        print(f"  • Слов в транскрипции: {word_count:,}")
        print(f"  • Длительность аудио: {result.get('total_duration', 0):.1f} секунд")
        print(f"  • Количество чанков: {result.get('chunk_count', 0)}")
        
    else:
        print("\n❌ ТЕСТИРОВАНИЕ ЗАВЕРШЕНО С ОШИБКОЙ")

if __name__ == "__main__":
    main() 