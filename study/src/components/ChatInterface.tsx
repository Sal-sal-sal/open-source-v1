import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader } from 'lucide-react';
import { MessageList } from './MessageList';
import { api } from '../api/client';
import type { ChatMessage } from '../types';

interface ChatInterfaceProps {
  fileId: string;
  filename: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ fileId, filename }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
    
    // Add welcome message
    setMessages([{
      role: 'assistant',
      content: `Привет! Я загрузил учебник "${filename}". Задавайте мне любые вопросы по его содержанию!`,
      timestamp: new Date().toISOString(),
    }]);
  }, [filename]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await api.sendMessage({
        message: inputMessage,
        file_id: fileId,
        context_window: 3,
      });

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.answer,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Извините, произошла ошибка при обработке вашего вопроса. Пожалуйста, попробуйте еще раз.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-200 rounded-lg shadow-lg">
      <div className="bg-gray-800 text-white p-4 rounded-t-lg">
        <h2 className="text-xl font-semibold">AI Учитель</h2>
        <p className="text-sm opacity-90">Учебник: {filename}</p>
      </div>

      <MessageList messages={messages} />

      <div className="border-t border-gray-700 p-4">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Задайте вопрос по учебнику..."
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}; 