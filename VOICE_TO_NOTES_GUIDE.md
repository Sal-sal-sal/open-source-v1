# Создание заметок из голосовых сообщений

## Обзор

Система теперь поддерживает автоматическое создание заметок из голосовых сообщений с использованием оптимизированной транскрибации Groq. Это позволяет пользователям быстро создавать структурированные заметки на основе голосовых записей.

## Возможности

### 1. Автоматическая транскрибация аудиокниг
- При загрузке аудио файла автоматически запускается транскрибация
- Используется оптимизированный Distil-Whisper с Groq
- Результат сохраняется в Google Cloud Storage (GCS)
- Поддерживаются форматы: MP3, WAV, WEBM, M4A, OGG

### 2. Создание заметок из голосовых сообщений
- Быстрая транскрибация голосовых сообщений через Groq
- Автоматическое создание структурированных заметок
- Сохранение в GCS для последующего использования
- Поддержка дополнительного текстового контента

### 3. Комбинированные заметки
- Объединение аудиокниг и голосовых сообщений
- Структурированный контент с разделами
- Метаданные для отслеживания источников

## API Endpoints

### 1. Загрузка аудио с автоматической транскрибацией

```http
POST /api/audio/load
Content-Type: multipart/form-data

Parameters:
- file: Audio file (required)
- auto_transcribe: boolean (default: true)
```

**Пример ответа:**
```json
{
  "file_id": "uuid-string",
  "transcription": {
    "status": "completed",
    "gcs_url": "gs://bucket/transcripts/user_id/file_id.json",
    "transcript_length": 1500,
    "total_duration": 120.5,
    "chunk_count": 3,
    "service_used": "groq",
    "model": "whisper-large-v3-turbo"
  }
}
```

### 2. Создание заметки из голосового сообщения

```http
POST /api/notes/create-from-voice-message/
Content-Type: multipart/form-data

Parameters:
- voice_file: Audio file (required)
- note_title: string (required)
- note_content: string (optional)
- tags: string (optional, comma-separated)
```

**Пример ответа:**
```json
{
  "status": "success",
  "note": {
    "id": "uuid-string",
    "title": "Заметка из голосового сообщения",
    "content": "## 🎤 Голосовое сообщение\n\nТранскрибированный текст...",
    "tags": ["голос", "заметка"],
    "user_id": "user-uuid",
    "created_at": "2024-12-01T10:30:00",
    "sources": {
      "voice_message_id": "message-uuid",
      "voice_message_metadata": {
        "original_filename": "voice.mp3",
        "processing_time": 2.34,
        "service_used": "groq",
        "model": "whisper-large-v3-turbo",
        "gcs_url": "gs://bucket/voice_messages/user_id/message_id.json"
      }
    }
  },
  "transcription": {
    "message_id": "message-uuid",
    "text": "Транскрибированный текст",
    "processing_time": 2.34,
    "gcs_url": "gs://bucket/voice_messages/user_id/message_id.json"
  },
  "note_length": 150
}
```

### 3. Создание заметки из голосового сообщения и транскрипции

```http
POST /api/notes/create-from-voice-and-transcript/
Content-Type: multipart/form-data

Parameters:
- voice_file: Audio file (required)
- transcript_file_id: string (required)
- note_title: string (required)
- note_content: string (optional)
- tags: string (optional, comma-separated)
```

**Пример ответа:**
```json
{
  "status": "success",
  "note": {
    "id": "uuid-string",
    "title": "Комбинированная заметка",
    "content": "## 📚 Аудио транскрипция\n\nТекст из аудиокниги...\n\n## 🎤 Голосовое сообщение\n\nТекст из голосового сообщения...",
    "tags": ["комбинированная", "аудиокнига", "голос"],
    "user_id": "user-uuid",
    "created_at": "2024-12-01T10:30:00",
    "sources": {
      "transcript_file_id": "file-uuid",
      "voice_message_id": "message-uuid",
      "transcript_metadata": {
        "original_filename": "audiobook.mp3",
        "total_duration": 1800.5,
        "service_used": "groq",
        "model": "whisper-large-v3-turbo"
      },
      "voice_message_metadata": {
        "original_filename": "voice.mp3",
        "processing_time": 2.34,
        "service_used": "groq",
        "model": "whisper-large-v3-turbo",
        "gcs_url": "gs://bucket/voice_messages/user_id/message_id.json"
      }
    }
  },
  "transcription": {
    "transcript_length": 2500,
    "voice_message_length": 150,
    "voice_message_id": "message-uuid",
    "voice_processing_time": 2.34,
    "voice_gcs_url": "gs://bucket/voice_messages/user_id/message_id.json"
  },
  "note_length": 2650
}
```

### 4. Получение списка транскрипций

```http
GET /api/notes/transcripts/
```

**Пример ответа:**
```json
{
  "transcripts": [
    {
      "file_id": "uuid-string",
      "original_filename": "audiobook.mp3",
      "transcript_length": 2500,
      "total_duration": 1800.5,
      "service_used": "groq",
      "model": "whisper-large-v3-turbo",
      "created_at": "2024-12-01T10:30:00"
    }
  ]
}
```

## Структура заметок

### Формат контента заметки

Заметки создаются в формате Markdown с четкой структурой:

```markdown
## 🎤 Голосовое сообщение

Транскрибированный текст из голосового сообщения...

## 📚 Аудио транскрипция

Текст из аудиокниги или длинного аудио файла...

## 📝 Дополнительные заметки

Дополнительный текст, добавленный пользователем...
```

### Метаданные

Каждая заметка содержит метаданные о источниках:

- **ID заметки**: Уникальный идентификатор
- **Заголовок**: Название заметки
- **Теги**: Категории для организации
- **Источники**: Информация о транскрипциях и голосовых сообщениях
- **Временные метки**: Даты создания
- **Статистика**: Длины текстов, время обработки

## Производительность

### Оптимизации транскрибации

1. **Быстрый режим Groq**:
   - Использование `json` вместо `verbose_json`
   - Убраны word-level timestamps
   - Добавлены промпты для качества

2. **Параллельная обработка**:
   - Чанки обрабатываются параллельно
   - Увеличенный размер чанков (120 секунд)
   - Минимальное перекрытие (1 секунда)

3. **Быстрый режим для коротких файлов**:
   - Файлы до 5 минут обрабатываются без чанкинга
   - Прямая отправка в Groq API

### Ожидаемые результаты

- **Голосовые сообщения**: 2-5 секунд
- **Короткие аудио (до 5 минут)**: 5-15 секунд
- **Длинные аудио**: 20-40% быстрее предыдущей версии

## Тестирование

### Тестовый скрипт

Запустите тест для проверки функциональности:

```bash
python test_notes_from_voice.py
```

Этот скрипт:
- Тестирует создание заметок из голосовых сообщений
- Проверяет комбинированные заметки
- Показывает производительность
- Сохраняет результаты в JSON

### Ручное тестирование

1. **Загрузка аудиокниги**:
   ```bash
   curl -X POST "http://localhost:8000/api/audio/load" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -F "file=@audiobook.mp3" \
     -F "auto_transcribe=true"
   ```

2. **Создание заметки из голоса**:
   ```bash
   curl -X POST "http://localhost:8000/api/notes/create-from-voice-message/" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -F "voice_file=@voice.mp3" \
     -F "note_title=Моя заметка" \
     -F "note_content=Дополнительный текст" \
     -F "tags=важное,заметка"
   ```

## Конфигурация

### Переменные окружения

```bash
# Groq API для транскрибации
GROQ_API_KEY=your_groq_api_key

# Google Cloud Storage
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
GCS_BUCKET_NAME=your-bucket-name
```

### Параметры по умолчанию

```python
# Транскрибация аудиокниг
chunk_size = 120  # секунд
overlap = 1       # секунд
fast_mode = True  # включен

# Быстрый режим
FAST_MODE_THRESHOLD = 300  # 5 минут

# Поддерживаемые форматы
SUPPORTED_FORMATS = [".mp3", ".wav", ".webm", ".m4a", ".ogg"]
```

## Устранение неполадок

### Частые проблемы

1. **Медленная транскрибация**:
   - Проверьте интернет соединение
   - Убедитесь в правильности API ключа
   - Проверьте размер файла

2. **Ошибки API**:
   - Проверьте лимиты Groq API
   - Убедитесь в правильности API ключа
   - Проверьте формат файла

3. **Проблемы с GCS**:
   - Проверьте права доступа к бакету
   - Убедитесь в правильности credentials
   - Проверьте имя бакета

### Логирование

Система ведет подробные логи:

```
INFO: Starting voice message transcription for: voice.mp3
INFO: Voice message transcribed in 2.34 seconds
INFO: Transcription completed and uploaded to GCS: gs://bucket/...
```

## Будущие улучшения

1. **База данных заметок**: Сохранение заметок в БД
2. **Поиск по заметкам**: Полнотекстовый поиск
3. **Экспорт заметок**: PDF, DOCX, TXT
4. **Шаблоны заметок**: Предустановленные форматы
5. **Совместное использование**: Поделка заметок между пользователями

## Заключение

Система создания заметок из голосовых сообщений предоставляет:

- **Быструю транскрибацию** с оптимизированным Groq
- **Структурированные заметки** в формате Markdown
- **Автоматическое сохранение** в GCS
- **Комбинирование источников** (аудиокниги + голос)
- **Подробные метаданные** для отслеживания

Результат: пользователи могут быстро создавать качественные заметки из голосовых записей с минимальными усилиями. 