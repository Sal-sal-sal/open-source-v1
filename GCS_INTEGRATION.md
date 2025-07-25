# Интеграция с Google Cloud Storage (GCS)

Этот документ описывает интеграцию системы с Google Cloud Storage для сохранения транскрибированных аудио файлов и создания заметок.

## Обзор

Система теперь поддерживает:
- **Автоматическое сохранение транскрипций** в GCS при загрузке аудио файлов
- **Сохранение голосовых сообщений** в GCS для последующего использования
- **Создание заметок** из транскрибированных данных
- **Комбинирование источников** для создания комплексных заметок

## Настройка

### 1. Google Cloud Storage

#### Создание Bucket
1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Cloud Storage API
4. Создайте bucket для хранения транскрипций

#### Настройка аутентификации
1. Создайте Service Account:
   ```bash
   gcloud iam service-accounts create transcription-service \
     --display-name="Transcription Service"
   ```

2. Создайте ключ:
   ```bash
   gcloud iam service-accounts keys create ~/gcs-key.json \
     --iam-account=transcription-service@your-project.iam.gserviceaccount.com
   ```

3. Назначьте роли:
   ```bash
   gcloud projects add-iam-policy-binding your-project \
     --member="serviceAccount:transcription-service@your-project.iam.gserviceaccount.com" \
     --role="roles/storage.objectAdmin"
   ```

### 2. Переменные окружения

Добавьте в файл `.env`:

```bash
# Google Cloud Storage
GCS_BUCKET_NAME=your-bucket-name
GOOGLE_APPLICATION_CREDENTIALS=/path/to/gcs-key.json

# Groq API (для транскрипции)
GROQ_API_KEY=gsk_your_groq_api_key_here
```

### 3. Установка зависимостей

```bash
pip install google-cloud-storage
```

## API Endpoints

### Загрузка аудио с автоматической транскрипцией

```bash
POST /api/audio/load
Content-Type: multipart/form-data

Parameters:
- file: Audio file (mp3, wav, webm, m4a, ogg)
- auto_transcribe: true/false (default: true)
```

**Пример ответа:**
```json
{
  "file_id": "uuid-here",
  "transcription": {
    "status": "completed",
    "gcs_url": "gs://bucket-name/transcripts/user-id/file-id/transcript.json",
    "transcript_length": 1500,
    "total_duration": 180.5,
    "chunk_count": 6,
    "service_used": "groq",
    "model": "distil-whisper-large-v3"
  }
}
```

### Транскрипция голосового сообщения с GCS

```bash
POST /api/audio/transcript/
Content-Type: multipart/form-data

Parameters:
- file: Audio file
- save_to_gcs: true/false (default: false)
- message_id: Unique message ID (optional)
- chat_id: Chat ID (optional)
```

**Пример ответа:**
```json
{
  "transcript": "Текст транскрипции...",
  "gcs_storage": {
    "status": "completed",
    "message_id": "message-uuid",
    "gcs_url": "gs://bucket-name/voice_messages/user-id/message-id/message.json"
  }
}
```

### Создание заметки из транскрипции

```bash
POST /api/notes/create-from-transcript/
Content-Type: application/x-www-form-urlencoded

Parameters:
- file_id: ID транскрибированного файла
- voice_message_id: ID голосового сообщения (optional)
- note_title: Заголовок заметки
- note_content: Дополнительный контент
- tags: Теги через запятую
```

**Пример ответа:**
```json
{
  "status": "success",
  "note": {
    "id": "note-uuid",
    "title": "Заголовок заметки",
    "content": "## 📚 Аудио транскрипция\n\nТекст транскрипции...\n\n## 🎤 Голосовое сообщение\n\nТекст сообщения...\n\n## 📝 Дополнительные заметки\n\nПользовательский контент...",
    "tags": ["тег1", "тег2"],
    "user_id": "user-id",
    "created_at": "2024-01-01T12:00:00",
    "sources": {
      "transcript_file_id": "file-id",
      "voice_message_id": "message-id",
      "transcript_metadata": {...}
    }
  },
  "transcript_length": 1500,
  "voice_message_length": 200
}
```

### Список транскрипций пользователя

```bash
GET /api/notes/transcripts/
```

**Пример ответа:**
```json
{
  "transcripts": [
    {
      "file_id": "file-uuid",
      "gcs_url": "gs://bucket-name/transcripts/user-id/file-id/transcript.json",
      "upload_timestamp": "2024-01-01T12:00:00",
      "original_filename": "audio.mp3",
      "transcript_length": 1500,
      "total_duration": 180.5,
      "service_used": "groq",
      "model": "distil-whisper-large-v3",
      "language": "ru"
    }
  ],
  "count": 1
}
```

### Комбинирование источников

```bash
POST /api/notes/combine-sources/
Content-Type: application/x-www-form-urlencoded

Parameters:
- file_ids: List of transcript file IDs
- voice_message_ids: List of voice message IDs
- title: Note title
- additional_content: Additional content
- tags: Comma-separated tags
```

## Структура данных в GCS

### Транскрипции
```
gs://bucket-name/
└── transcripts/
    └── user-id/
        └── file-id/
            └── transcript.json
```

**Содержимое transcript.json:**
```json
{
  "transcript": "Полный текст транскрипции...",
  "chunks": [
    {
      "start": 0.0,
      "end": 30.0,
      "text": "Текст чанка..."
    }
  ],
  "total_duration": 180.5,
  "chunk_count": 6,
  "service_used": "groq",
  "model": "distil-whisper-large-v3",
  "language": "ru",
  "task": "transcribe"
}
```

### Голосовые сообщения
```
gs://bucket-name/
└── voice_messages/
    └── user-id/
        └── message-id/
            └── message.json
```

**Содержимое message.json:**
```json
{
  "message_id": "message-uuid",
  "user_id": "user-id",
  "chat_id": "chat-id",
  "transcript": "Текст голосового сообщения...",
  "timestamp": "2024-01-01T12:00:00",
  "type": "voice_message"
}
```

## Использование

### 1. Загрузка аудио файла

```python
import requests

# Загрузка с автоматической транскрипцией
with open('audio.mp3', 'rb') as f:
    files = {'file': f}
    data = {'auto_transcribe': 'true'}
    
    response = requests.post(
        'http://localhost:8000/api/audio/load',
        files=files,
        data=data
    )
    
    result = response.json()
    file_id = result['file_id']
    gcs_url = result['transcription']['gcs_url']
```

### 2. Создание заметки

```python
# Создание заметки из транскрипции
data = {
    'file_id': file_id,
    'note_title': 'Моя заметка',
    'note_content': 'Дополнительные мысли...',
    'tags': 'аудио, заметки'
}

response = requests.post(
    'http://localhost:8000/api/notes/create-from-transcript/',
    data=data
)

note = response.json()['note']
```

### 3. Комбинирование источников

```python
# Создание заметки из нескольких источников
data = {
    'file_ids': ['file1', 'file2'],
    'voice_message_ids': ['message1'],
    'title': 'Комплексная заметка',
    'additional_content': 'Дополнительный контент',
    'tags': 'комбинированная, заметка'
}

response = requests.post(
    'http://localhost:8000/api/notes/combine-sources/',
    data=data
)
```

## Тестирование

### Запуск тестов

```bash
python test_gcs_integration.py
```

### Тесты включают:

1. **Загрузка с транскрипцией** - Проверяет автоматическую транскрипцию и сохранение в GCS
2. **Голосовое сообщение с GCS** - Тестирует сохранение голосовых сообщений
3. **Список транскрипций** - Проверяет получение списка пользовательских транскрипций
4. **Создание заметки** - Тестирует создание заметок из транскрибированных данных

## Безопасность

### Аутентификация
- Используется Service Account для доступа к GCS
- Каждый пользователь имеет изолированное пространство в bucket
- Доступ контролируется на уровне пользователя

### Структура доступа
```
transcripts/user-id/file-id/     # Только для конкретного пользователя
voice_messages/user-id/message-id/  # Только для конкретного пользователя
```

### Рекомендации
1. Используйте отдельный bucket для транскрипций
2. Настройте lifecycle policies для автоматической очистки
3. Включите аудит доступа к bucket
4. Регулярно ротируйте ключи Service Account

## Мониторинг и логирование

### Логи
Все операции с GCS логируются:
- Загрузка транскрипций
- Сохранение голосовых сообщений
- Ошибки доступа
- Статистика использования

### Метрики
- Количество загруженных транскрипций
- Размер данных в GCS
- Время обработки
- Ошибки транскрипции

## Устранение неполадок

### Проблема: "GCS_BUCKET_NAME не указан"

**Решение:**
1. Проверьте переменную окружения `GCS_BUCKET_NAME`
2. Убедитесь, что bucket существует в GCS
3. Проверьте права доступа Service Account

### Проблема: "Failed to initialize GCS client"

**Решение:**
1. Проверьте путь к файлу ключа в `GOOGLE_APPLICATION_CREDENTIALS`
2. Убедитесь, что Service Account имеет необходимые права
3. Проверьте подключение к интернету

### Проблема: "Transcript not found in GCS"

**Решение:**
1. Проверьте, что транскрипция была успешно загружена
2. Убедитесь, что file_id и user_id корректны
3. Проверьте права доступа к файлу в GCS

### Проблема: Медленная загрузка в GCS

**Решение:**
1. Используйте bucket в том же регионе, что и сервер
2. Оптимизируйте размер транскрипций
3. Рассмотрите использование CDN для часто используемых файлов

## Будущие улучшения

- [ ] Параллельная загрузка в GCS
- [ ] Кэширование часто используемых транскрипций
- [ ] Автоматическая архивация старых данных
- [ ] Интеграция с Google Cloud Functions
- [ ] Поддержка других облачных хранилищ (AWS S3, Azure Blob)
- [ ] Версионирование транскрипций
- [ ] Поиск по содержимому транскрипций 