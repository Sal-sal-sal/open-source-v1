import React, { useState } from 'react';
import { FileUploadForm } from './FileUploadForm';
import type { FileUploadResponse } from '../types';

interface CreateBookChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookChatCreated: (bookChatId: string) => void;
}

const CreateBookChatModal: React.FC<CreateBookChatModalProps> = ({ isOpen, onClose, onBookChatCreated }) => {
  const [error, setError] = useState<string | null>(null);

  const handleUploadSuccess = (response: FileUploadResponse) => {
    if (response.book_chat_id) {
      onBookChatCreated(response.book_chat_id);
      onClose();
    } else {
      setError('Не удалось создать book_chat.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-white">✕</button>
        <h2 className="text-lg font-semibold mb-4 text-center">Загрузить документ и создать Book Chat</h2>
        <FileUploadForm onUploadSuccess={handleUploadSuccess} />
        {error && <div className="text-center text-red-500 mt-4">{error}</div>}
      </div>
    </div>
  );
};

export default CreateBookChatModal; 