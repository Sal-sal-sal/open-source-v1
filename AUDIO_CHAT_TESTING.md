# Тестирование Audio Chat с Groq Whisper

Этот документ описывает, как протестировать запись аудио сообщений в audio_chat с обработкой через Groq Whisper и выводом результата в терминал.

## Быстрый старт

### 1. Настройка API ключа

Добавьте ваш Groq API ключ в файл `.env`:

```bash
GROQ_API_KEY=gsk_your_groq_api_key_here
```

### 2. Быстрый тест (рекомендуется)

Используйте простой скрипт для быстрого тестирования:

```bash
python quick_groq_test.py
```

Этот скрипт:
- Ищет аудио файлы в директории `uploads/`
- Позволяет выбрать файл для транскрипции
- Использует модель `whisper-large-v3-turbo`
- Выводит результат в терминал
- Сохраняет результат в текстовый файл

### 3. Полный тест с локальным API

Если у вас запущен FastAPI сервер:

```bash
python simple_audio_chat_test.py
```

Этот скрипт:
- Тестирует транскрипцию через локальный API
- Сравнивает результаты с прямым вызовом Groq API
- Показывает доступные сервисы транскрипции
- Сохраняет подробные результаты

## Подготовка аудио файлов

### Размещение файлов

Поместите аудио файлы в директорию `uploads/`:

```
uploads/
├── your_audio.mp3
├── test_message.wav
└── voice_note.webm
```

### Поддерживаемые форматы

- **MP3** (рекомендуется)
- **WAV**
- **WebM**
- **M4A**
- **OGG**

## Пример использования

### 1. Запуск быстрого теста

```bash
$ python quick_groq_test.py

🎵 Быстрый тест Groq транскрипции
========================================
✅ GROQ_API_KEY найден
✅ Найдено 2 аудио файлов:
  1. test_message.mp3
  2. voice_note.wav
✅ Автоматически выбран: test_message.mp3

🔄 Транскрибирую файл: test_message.mp3
Используется модель: whisper-large-v3-turbo

========================================
📝 РЕЗУЛЬТАТ ТРАНСКРИПЦИИ:
========================================
Привет, это тестовое аудио сообщение для проверки работы Groq Whisper транскрипции.
========================================

💾 Результат сохранен в: transcript_test_message.mp3.txt
```

### 2. Запуск полного теста

```bash
$ python simple_audio_chat_test.py

🎵 Audio Chat - Groq Whisper Integration Test
============================================================
✅ GROQ_API_KEY найден

============================================================
📋 Доступные сервисы транскрипции:
  openai: ✅ Доступен (OpenAI Whisper)
  groq: ✅ Доступен (Groq Whisper)

============================================================
🔍 Поиск аудио файлов...
✅ Найдено 1 аудио файлов:
  1. test_message.mp3
✅ Выбран файл: test_message.mp3

============================================================
🧪 ТЕСТИРОВАНИЕ ТРАНСКРИПЦИИ
============================================================

1️⃣ Тест через локальный API (Groq):
🔄 Отправляю файл test_message.mp3 на транскрипцию через локальный API (Groq)...
✅ Транскрипция успешно завершена! Использован сервис: groq

📝 РЕЗУЛЬТАТ (Локальный API):
----------------------------------------
Привет, это тестовое аудио сообщение для проверки работы Groq Whisper транскрипции.
----------------------------------------

2️⃣ Тест напрямую через Groq API:
🔄 Отправляю файл test_message.mp3 на транскрипцию через Groq...
✅ Транскрипция успешно завершена!

📝 РЕЗУЛЬТАТ (Прямой Groq API):
----------------------------------------
Привет, это тестовое аудио сообщение для проверки работы Groq Whisper транскрипции.
----------------------------------------

============================================================
🔍 СРАВНЕНИЕ РЕЗУЛЬТАТОВ
============================================================
✅ Результаты идентичны!

============================================================
💾 СОХРАНЕНИЕ РЕЗУЛЬТАТОВ
============================================================
✅ Результаты сохранены в файл: transcription_test_results_test_message.json
```

## Интеграция с Audio Chat

### В веб-интерфейсе

1. Откройте Audio Chat в браузере
2. Используйте VoiceRecorder компонент для записи
3. Система автоматически использует Groq для транскрипции
4. Результат появится в интерфейсе

### Через API

```bash
# Транскрипция с принудительным использованием Groq
curl -X POST "http://localhost:8000/api/audio/transcript/" \
  -F "file=@your_audio.mp3" \
  -F "service=groq"

# Получение информации о доступных сервисах
curl "http://localhost:8000/api/audio/transcription-services"
```

## Устранение неполадок

### Проблема: "GROQ_API_KEY не найден"

**Решение:**
1. Проверьте файл `.env` в корне проекта
2. Убедитесь, что ключ начинается с `gsk_`
3. Перезапустите терминал после изменения `.env`

### Проблема: "Аудио файлы не найдены"

**Решение:**
1. Создайте директорию `uploads/` если её нет
2. Поместите аудио файл в эту директорию
3. Убедитесь, что файл имеет поддерживаемое расширение

### Проблема: "Ошибка транскрипции"

**Решение:**
1. Проверьте интернет соединение
2. Убедитесь, что API ключ действителен
3. Проверьте размер аудио файла (рекомендуется до 25MB)
4. Убедитесь, что аудио файл не поврежден

### Проблема: "Не удалось подключиться к локальному API"

**Решение:**
1. Убедитесь, что FastAPI сервер запущен
2. Проверьте, что сервер работает на `http://localhost:8000`
3. Используйте `quick_groq_test.py` для прямого тестирования

## Файлы результатов

### Текстовые файлы

Результаты транскрипции сохраняются в файлы:
- `transcript_filename.txt` - простой текст
- `transcription_test_results_filename.json` - подробная информация

### JSON файлы

Содержат:
- Путь к аудио файлу
- Размер файла
- Результаты транскрипции
- Информацию о сервисах
- Временные метки

## Дополнительные возможности

### Запись аудио с микрофона

Для записи аудио с микрофона (требует установки pyaudio):

```bash
pip install pyaudio
python test_audio_chat_groq.py
```

### Тестирование различных сервисов

```bash
# Тест только OpenAI
curl -X POST "http://localhost:8000/api/audio/transcript/" \
  -F "file=@audio.mp3" \
  -F "service=openai"

# Тест только Groq
curl -X POST "http://localhost:8000/api/audio/transcript/" \
  -F "file=@audio.mp3" \
  -F "service=groq"

# Автоматический выбор (по умолчанию)
curl -X POST "http://localhost:8000/api/audio/transcript/" \
  -F "file=@audio.mp3"
```

## Производительность

### Groq vs OpenAI

- **Скорость**: Groq обычно быстрее
- **Стоимость**: Groq более экономичен
- **Качество**: Оба используют Whisper модели
- **Надежность**: Автоматический fallback между сервисами

### Рекомендации

1. Используйте Groq как основной сервис
2. OpenAI как fallback
3. Тестируйте с разными аудио форматами
4. Сохраняйте результаты для анализа 