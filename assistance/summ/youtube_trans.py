from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import TranscriptsDisabled, NoTranscriptFound

def get_transcript(video_url, language_codes=['en', 'ru', 'kk', 'de', 'fr', 'es', 'it', 'ja', 'ko', 'pt', 'zh','ar',]):
    video_id = video_url.split('v=')[1]

    try:
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)

        # Попытка взять на нужном языке
        for lang in language_codes:
            try:
                transcript = transcript_list.find_transcript([lang])
                break
            except NoTranscriptFound:
                continue
        else:
            # Если не найдено ни на одном из языков — взять перевод
            transcript = transcript_list.find_transcript(language_codes).translate('en')

        # Используем доступ через .text
        full_text = " ".join([t.text for t in transcript.fetch()])
        return full_text

    except TranscriptsDisabled:
        return "Субтитры отключены для этого видео."
    except Exception as e:
        return f"Ошибка: {str(e)}"

if __name__ == "__main__":
    print(get_transcript('https://www.youtube.com/watch?v=Y4iw5QLQJ7s'))
