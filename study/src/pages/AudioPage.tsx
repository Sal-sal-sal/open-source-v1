import React, { useCallback, useState, useEffect } from 'react';
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
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in after mount
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 200);
    
    return () => clearTimeout(timer);
  }, []);

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
        style={{ 
          filter: 'brightness(0.3)',
          pointerEvents: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none'
        }}
      >
        <source src="/resurses/audiobook.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Затемнение поверх видео */}
      <div className="absolute inset-0 bg-black/40 z-10"></div>
      
      {/* Контент */}
      <div className={`relative z-20 flex flex-col items-center justify-center w-full max-w-4xl transition-all duration-1000 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}>
        {/* Загрузка файлов с анимацией */}
        <div className={`w-full max-w-lg transition-all duration-700 ease-out delay-200 ${
          isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
        }`}>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Аудио Библиотека</h1>
            <p className="text-lg text-white/80">Загрузите аудио файл для создания интерактивного чата</p>
          </div>
          
          <div
            {...getRootProps()}
            className={`w-full p-12 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors backdrop-blur-sm bg-white/10
            ${isDragActive ? 'border-blue-400 bg-blue-500/20' : 'border-white/50 hover:border-blue-300 hover:bg-white/20'}`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center">
              <FaMusic className="w-20 h-20 text-white mb-6" />
              <p className="text-xl font-semibold text-white mb-2">
                {t('Загрузите сюда свой mp3 с аудио книгой')}
              </p>
              <p className="text-sm text-white/80 mt-2">
                {t('Перетащите файл или кликните для выбора')}
              </p>
              <div className="mt-4 text-xs text-white/60">
                Поддерживаемые форматы: MP3, WAV
              </div>
            </div>
          </div>
          
          {loading && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center space-x-2 text-white">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                <span className="text-lg">{t('Загрузка и обработка...')}</span>
              </div>
            </div>
          )}
          
          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-300 rounded-lg">
              <p className="text-red-300 text-center">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioPage; 