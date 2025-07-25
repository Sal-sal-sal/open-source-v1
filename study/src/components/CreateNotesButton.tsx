import React, { useState } from 'react';
import { createNotesFromChatHistory } from '../utils/notes';
import { trackError } from '../utils/analytics';
import { FileText } from 'lucide-react';

interface CreateNotesButtonProps {
  chatId: string;
  chatType: 'chat' | 'book_chat' | 'audio_chat';
  currentTime?: number; // For audio chats
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

const CreateNotesButton: React.FC<CreateNotesButtonProps> = ({
  chatId,
  chatType,
  currentTime,
  onSuccess,
  onError,
  className = '',
  disabled = false
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateNotes = async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);
    try {
      await createNotesFromChatHistory(chatId, chatType, currentTime);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create notes';
      trackError('create_notes_button_failed', errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleCreateNotes}
      disabled={disabled || isLoading}
      className={`
        inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md
        transition-colors duration-200
        ${disabled || isLoading
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 hover:border-blue-300'
        }
        ${className}
      `}
      title="Create structured notes from chat history"
    >
      <FileText size={16} />
      {isLoading ? 'Creating...' : 'Create Notes'}
    </button>
  );
};

export default CreateNotesButton; 