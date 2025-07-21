import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

import { API_BASE_URL } from '../api/client'; // Предполагаю, что это определено в client.tsx

const AudioPage: React.FC = () => {
  const { t } = useTranslation();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [transcript, setTranscript] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [title, setTitle] = useState<string>(''); // Для заголовка
  const [subtitle, setSubtitle] = useState<string>(''); // Для подзаголовка

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAudioFile(e.target.files[0]);
    }
  };

  const handleUploadAndTranscribe = async () => {
    if (!audioFile) return;
    setLoading(true);

    try {
      // Загрузка аудио
      const formData = new FormData();
      formData.append('file', audioFile);
      const loadResponse = await axios.post(`${API_BASE_URL}/api/audio/load`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const { file_path } = loadResponse.data;
      setAudioUrl(file_path); // Или полный URL, если нужно

      // Транскрипция
      const transcriptResponse = await axios.post(`${API_BASE_URL}/api/audio/transcript/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setTranscript(transcriptResponse.data.transcript);

      // Симулируем заголовок и подзаголовок (можно генерировать из транскрипции)
    } catch (error) {
      console.error('Error uploading or transcribing audio:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1b1b1b] text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-gray-900 rounded-lg overflow-hidden shadow-lg">
        {/* Заголовок и подзаголовок */}
        <div className="relative bg-gradient-to-r from-blue-900 to-black p-6">
          <img src="" alt="" />
          <span className="absolute top-2 left-2 bg-red-600 text-xs px-2 py-1 rounded">Аудиокнига</span>
          <h1 className="text-3xl font-bold text-center">{title || 'Заголовок аудио'}</h1>
          <h2 className="text-xl text-center text-gray-300">{subtitle || 'Подзаголовок'}</h2>
        </div>

        {/* Текст транскрипции */}
        <div className="p-6 text-lg leading-relaxed">
          <p>{transcript || 'Здесь будет текст транскрипции аудио...'}</p>
        </div>

        {/* Аудио плеер */}
        <div className="bg-gray-800 p-4 flex items-center justify-between">
          <audio controls src={audioUrl} className="w-full">
            Your browser does not support the audio element.
          </audio>
        </div>
      </div>

      {/* Форма загрузки */}
      <div className="mt-8">
        <input type="file" accept="audio/*" onChange={handleFileChange} className="mb-4" />
        <button
          onClick={handleUploadAndTranscribe}
          disabled={loading || !audioFile}
          className="bg-cyan-500 hover:bg-cyan-600 text-black py-2 px-4 rounded"
        >
          {loading ? t('Processing') : t('Transcribe')}
        </button>
      </div>
    </div>
  );
};

export default AudioPage; 