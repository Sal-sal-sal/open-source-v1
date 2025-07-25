import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../api/client';
import { FaMusic } from 'react-icons/fa';
import { getGradient } from '../utils/gradients';

const AudioPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      // Step 1: Upload the file and get the file_id
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      
      const uploadResponse = await apiClient.post('/api/audio/load', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const { file_id } = uploadResponse.data;

      if (!file_id) {
        throw new Error("File upload did not return a file_id.");
      }

      // Step 2: Create the audio chat with the new file_id
      const chatResponse = await apiClient.post('/api/audio-chats/', {
        file_id: file_id,
        name: file.name.replace(/\.[^/.]+$/, "") // Use filename as title
      });
      const { id: audio_chat_id } = chatResponse.data;

      // Step 3: Navigate to the new chat page
      navigate(`/audio-chat/${audio_chat_id}`);

    } catch (err) {
      setError('Failed to create audio session. Please try again.');
      console.error(err);
      setLoading(false);
    }
  }, [navigate]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'audio/mpeg': ['.mp3'], 'audio/wav': ['.wav'] },
    multiple: false,
  });

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Видео фон */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{ filter: 'brightness(0.3)' }}
      >
        <source src="/resurses/audiobook.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Затемнение поверх видео */}
      <div className="absolute inset-0 bg-black/40 z-10"></div>
      
      {/* Контент */}
      <div className="relative z-20 flex flex-col items-center justify-center w-full">
        <div
          {...getRootProps()}
          className={`w-full max-w-lg p-10 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors backdrop-blur-sm bg-white/10
          ${isDragActive ? 'border-blue-400 bg-blue-500/20' : 'border-white/50 hover:border-blue-300 hover:bg-white/20'}`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center">
            <FaMusic className="w-16 h-16 text-white mb-4" />
            <p className="text-lg font-semibold text-white">
              {t('Загрузите сюда свой mp3 с аудио книгой')}
            </p>
            <p className="text-sm text-white/80 mt-1">
              {t('Перетащите файл или кликните для выбора')}
            </p>
          </div>
        </div>
        {loading && <p className="mt-4 text-lg text-white">{t('Загрузка и обработка...')}</p>}
        {error && <p className="mt-4 text-red-300">{error}</p>}
      </div>
    </div>
  );
};

export default AudioPage; 