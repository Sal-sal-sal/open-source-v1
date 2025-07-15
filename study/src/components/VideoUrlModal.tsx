import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

interface VideoUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (url: string) => void;
}

const VideoUrlModal: React.FC<VideoUrlModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    if (!youtubeRegex.test(url)) {
      setError('Please enter a valid YouTube URL.');
      return;
    }
    setError('');
    onSubmit(url);
    setUrl('');
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1000]">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-lg relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <X size={24} />
        </button>
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{t('SubmitYouTubeURL', 'Submit YouTube URL')}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white rounded-md p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-gray-200 dark:bg-slate-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors"
            >
              {t('Cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-cyan-500 text-black hover:bg-cyan-600 transition-colors"
            >
              {t('GetSummary', 'Get Summary')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VideoUrlModal; 