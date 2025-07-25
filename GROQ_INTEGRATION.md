# Groq API Integration for Audio Transcription

This document describes the integration of Groq API as an alternative transcription service to OpenAI Whisper in the LearnTug application.

## Overview

The Groq integration provides:
- **Cost Optimization**: Groq is often more cost-effective than OpenAI
- **Performance**: Potentially faster processing times
- **Service Redundancy**: Automatic fallback if one service fails
- **Flexibility**: Users can choose their preferred service

## Setup

### 1. Get a Groq API Key

1. Visit [Groq Console](https://console.groq.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the API key (starts with `gsk_`)

### 2. Configure Environment Variables

Add your Groq API key to your `.env` file:

```bash
# Required for Groq transcription
GROQ_API_KEY=gsk_your_groq_api_key_here

# Existing OpenAI key (still needed for fallback)
OPENAI_API_KEY=your_openai_key_here
```

### 3. Test the Integration

Run the test script to verify everything is working:

```bash
python test_groq_transcription.py
```

## Usage

### Automatic Service Selection (Recommended)

The system automatically chooses the best available service:

```python
from assistance.audio_live.transcription_service import transcribe_audio

# Automatic service selection with fallback
transcript = await transcribe_audio(audio_file)
```

### Force Specific Service

You can force the use of a specific service:

```python
# Force OpenAI
transcript = await transcribe_audio(audio_file, service="openai")

# Force Groq
transcript = await transcribe_audio(audio_file, service="groq")
```

### API Endpoints

#### Get Available Services
```bash
GET /api/audio/transcription-services
```

Response:
```json
{
  "openai": {
    "available": true,
    "name": "OpenAI Whisper",
    "model": "whisper-1"
  },
  "groq": {
    "available": true,
    "name": "Groq Whisper",
    "model": "whisper-large-v3-turbo"
  },
  "preferred": "auto"
}
```

#### Transcribe Audio
```bash
POST /api/audio/transcript/
Content-Type: multipart/form-data

Parameters:
- file: Audio file (webm, mp3, wav, m4a, ogg)
- current_time: Optional - current playback time
- total_duration: Optional - total file duration
- service: Optional - "openai", "groq", or "auto" (default)
```

Response:
```json
{
  "transcript": "Transcribed text here...",
  "start_time": 0.0,
  "end_time": 120.0,
  "interval_duration": 120.0,
  "service_used": "groq"
}
```

## Frontend Integration

### VoiceRecorder Component

The VoiceRecorder component now supports service selection:

```tsx
<VoiceRecorder
  onRecordingComplete={handleRecordingComplete}
  onError={handleError}
  preferredService="groq"  // Optional: "openai", "groq", or "auto"
/>
```

### Service Selection in Audio Chat

You can specify the preferred service when creating voice messages:

```tsx
// In AudioChatView.tsx
<VoiceRecorder
  onRecordingComplete={handleVoiceMessageComplete}
  onError={handleVoiceMessageError}
  preferredService="groq"  // Use Groq for this chat
/>
```

## Technical Details

### Service Architecture

```
TranscriptionService
├── OpenAI Whisper (fallback)
└── Groq Whisper (primary)
```

### Models Used

- **OpenAI**: `whisper-1`
- **Groq**: `whisper-large-v3-turbo`

### Response Formats

Both services support:
- **JSON**: Simple text response
- **Verbose JSON**: Word-level timestamps for time-based filtering

### Error Handling

The system includes comprehensive error handling:
- Automatic fallback between services
- Detailed logging for debugging
- Graceful degradation if services are unavailable

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GROQ_API_KEY` | Groq API key | Yes (for Groq) |
| `OPENAI_API_KEY` | OpenAI API key | Yes (for OpenAI) |

### Service Preferences

You can configure the preferred service in the TranscriptionService:

```python
# In assistance/audio_live/transcription_service.py
transcription_service = TranscriptionService(preferred_service="groq")
```

Options:
- `"auto"`: Automatic selection with fallback (default)
- `"openai"`: Force OpenAI
- `"groq"`: Force Groq

## Troubleshooting

### Common Issues

#### 1. "Groq API key not configured"
**Solution**: Add `GROQ_API_KEY` to your `.env` file

#### 2. "API key is invalid or expired"
**Solution**: 
- Check your API key at [Groq Console](https://console.groq.com/)
- Generate a new key if needed

#### 3. "All transcription services failed"
**Solution**:
- Check internet connection
- Verify both API keys are valid
- Check service status at [Groq Status](https://status.groq.com/)

#### 4. Transcription quality issues
**Solution**:
- Try different audio formats (MP3, WAV)
- Ensure audio quality is good
- Check if the issue persists with both services

### Testing

Use the provided test script:

```bash
python test_groq_transcription.py
```

This will test:
- API key availability
- API connection
- Service integration

## Performance Comparison

### Speed
- **Groq**: Generally faster due to optimized infrastructure
- **OpenAI**: Standard processing speed

### Cost
- **Groq**: More cost-effective for most use cases
- **OpenAI**: Standard pricing

### Quality
- **Both**: High-quality transcription using Whisper models
- **Groq**: Uses optimized Whisper-large-v3-turbo model

## Migration Guide

### From OpenAI-only to Dual Service

1. **No Breaking Changes**: Existing code continues to work
2. **Automatic Fallback**: System automatically uses available services
3. **Optional Service Selection**: Add service parameter when needed

### Example Migration

**Before (OpenAI only)**:
```python
from assistance.audio_live.audio_whisper import transcribe_audio
result = await transcribe_audio(file)
```

**After (Dual service)**:
```python
from assistance.audio_live.transcription_service import transcribe_audio
result = await transcribe_audio(file)  # Still works!
# Or specify service:
result = await transcribe_audio(file, service="groq")
```

## Support

For issues related to Groq integration:

1. Check this documentation
2. Run the test script: `python test_groq_transcription.py`
3. Check the logs for detailed error messages
4. Verify your API keys and internet connection

## Future Enhancements

- [ ] Service performance monitoring
- [ ] Automatic service selection based on performance
- [ ] Support for additional transcription services
- [ ] Batch processing optimization
- [ ] Real-time transcription support 