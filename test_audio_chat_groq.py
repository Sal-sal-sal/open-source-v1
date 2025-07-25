#!/usr/bin/env python3
"""
Скрипт для тестирования записи аудио сообщений в audio_chat с обработкой через Groq Whisper.
Этот скрипт позволяет записать аудио, отправить его на транскрипцию через Groq и увидеть результат в терминале.
"""

import os
import asyncio
import tempfile
import wave
import pyaudio
import requests
from dotenv import load_dotenv
import json

# Загружаем переменные окружения
load_dotenv()

GROQ_API_URL = "https://api.groq.com/openai/v1/audio/transcriptions"
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

class AudioRecorder:
    """Класс для записи аудио с микрофона"""
    
    def __init__(self):
        self.CHUNK = 1024
        self.FORMAT = pyaudio.paInt16
        self.CHANNELS = 1
        self.RATE = 44100
        self.p = pyaudio.PyAudio()
        
    def record_audio(self, duration=5, filename="temp_audio.wav"):
        """
        Записывает аудио с микрофона
        
        Args:
            duration: длительность записи в секундах
            filename: имя файла для сохранения
            
        Returns:
            str: путь к записанному файлу
        """
        print(f"🎤 Начинаю запись аудио на {duration} секунд...")
        print("Говорите в микрофон...")
        
        stream = self.p.open(
            format=self.FORMAT,
            channels=self.CHANNELS,
            rate=self.RATE,
            input=True,
            frames_per_buffer=self.CHUNK
        )
        
        frames = []
        
        for i in range(0, int(self.RATE / self.CHUNK * duration)):
            data = stream.read(self.CHUNK)
            frames.append(data)
            # Показываем прогресс записи
            progress = (i + 1) / int(self.RATE / self.CHUNK * duration) * 100
            print(f"\r📹 Запись: {progress:.1f}%", end="", flush=True)
        
        print("\n✅ Запись завершена!")
        
        stream.stop_stream()
        stream.close()
        
        # Сохраняем аудио в файл
        with wave.open(filename, 'wb') as wf:
            wf.setnchannels(self.CHANNELS)
            wf.setsampwidth(self.p.get_sample_size(self.FORMAT))
            wf.setframerate(self.RATE)
            wf.writeframes(b''.join(frames))
        
        return filename
    
    def cleanup(self):
        """Очищает ресурсы"""
        self.p.terminate()

def transcribe_with_groq(audio_file_path):
    """
    Транскрибирует аудио файл через Groq API
    
    Args:
        audio_file_path: путь к аудио файлу
        
    Returns:
        str: транскрибированный текст
    """
    if not GROQ_API_KEY:
        print("❌ GROQ_API_KEY не найден в переменных окружения")
        print("Добавьте GROQ_API_KEY=your_key в файл .env")
        return None
    
    print(f"🔄 Отправляю аудио на транскрипцию через Groq...")
    
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

def simulate_audio_chat_workflow():
    """
    Симулирует полный workflow audio_chat:
    1. Запись аудио сообщения
    2. Обработка через Groq Whisper
    3. Вывод результата в терминал
    """
    print("🎵 Audio Chat - Groq Whisper Integration")
    print("=" * 50)
    
    # Проверяем доступность Groq API
    if not GROQ_API_KEY:
        print("❌ GROQ_API_KEY не настроен")
        print("1. Получите API ключ на https://console.groq.com/")
        print("2. Добавьте GROQ_API_KEY=your_key в файл .env")
        return
    
    print("✅ GROQ_API_KEY найден")
    
    # Создаем временный файл для аудио
    temp_audio_file = "temp_audio_message.wav"
    
    try:
        # Инициализируем записывающее устройство
        recorder = AudioRecorder()
        
        # Запрашиваем длительность записи у пользователя
        while True:
            try:
                duration = input("\n⏱️  Введите длительность записи в секундах (по умолчанию 5): ").strip()
                if not duration:
                    duration = 5
                else:
                    duration = int(duration)
                if duration > 0:
                    break
                else:
                    print("❌ Длительность должна быть больше 0")
            except ValueError:
                print("❌ Введите корректное число")
        
        # Записываем аудио
        audio_file = recorder.record_audio(duration, temp_audio_file)
        
        # Транскрибируем через Groq
        transcript = transcribe_with_groq(audio_file)
        
        if transcript:
            print("\n" + "=" * 50)
            print("📝 РЕЗУЛЬТАТ ТРАНСКРИПЦИИ:")
            print("=" * 50)
            print(transcript)
            print("=" * 50)
            
            # Сохраняем результат в файл для истории
            timestamp = asyncio.get_event_loop().time()
            history_file = f"audio_chat_history_{int(timestamp)}.json"
            
            history_data = {
                "timestamp": timestamp,
                "audio_file": audio_file,
                "duration_seconds": duration,
                "transcript": transcript,
                "service": "groq",
                "model": "whisper-large-v3-turbo"
            }
            
            with open(history_file, 'w', encoding='utf-8') as f:
                json.dump(history_data, f, ensure_ascii=False, indent=2)
            
            print(f"💾 Результат сохранен в файл: {history_file}")
            
        else:
            print("❌ Не удалось получить транскрипцию")
        
        # Очищаем ресурсы
        recorder.cleanup()
        
    except KeyboardInterrupt:
        print("\n\n⏹️  Запись прервана пользователем")
    except Exception as e:
        print(f"\n❌ Ошибка: {str(e)}")
    finally:
        # Удаляем временный аудио файл
        if os.path.exists(temp_audio_file):
            os.remove(temp_audio_file)
            print(f"🗑️  Временный файл {temp_audio_file} удален")

def test_groq_connection():
    """Тестирует подключение к Groq API"""
    print("🔍 Тестирование подключения к Groq API...")
    
    if not GROQ_API_KEY:
        print("❌ GROQ_API_KEY не найден")
        return False
    
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}"
    }
    
    try:
        response = requests.get("https://api.groq.com/openai/v1/models", headers=headers)
        
        if response.status_code == 200:
            print("✅ Подключение к Groq API успешно")
            return True
        elif response.status_code == 401:
            print("❌ Неверный API ключ")
            return False
        else:
            print(f"⚠️  Неожиданный ответ: {response.status_code}")
            return True
            
    except Exception as e:
        print(f"❌ Ошибка подключения: {str(e)}")
        return False

def main():
    """Главная функция"""
    print("🎵 Audio Chat - Groq Whisper Integration")
    print("=" * 50)
    
    # Проверяем подключение
    if not test_groq_connection():
        print("\n❌ Не удалось подключиться к Groq API")
        print("Проверьте ваш API ключ и интернет соединение")
        return
    
    print("\n🚀 Готов к записи аудио сообщений!")
    print("Нажмите Ctrl+C для выхода")
    
    try:
        while True:
            simulate_audio_chat_workflow()
            
            # Спрашиваем, хочет ли пользователь продолжить
            choice = input("\n🔄 Записать еще одно сообщение? (y/n): ").strip().lower()
            if choice not in ['y', 'yes', 'да', 'д']:
                break
                
    except KeyboardInterrupt:
        print("\n\n👋 До свидания!")

if __name__ == "__main__":
    main() 