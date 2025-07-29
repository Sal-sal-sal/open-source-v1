import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader, Mic, Edit3, Check, X } from 'lucide-react';
import { MessageList } from './MessageList';
import { api } from '../api/client';
import type { ChatMessage } from '../types';

interface AudioChatInterfaceProps {
  className?: string;
}

export const AudioChatInterface: React.FC<AudioChatInterfaceProps> = ({ className = "" }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [originalNote, setOriginalNote] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // Animate in after mount
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    // Focus input on mount
    inputRef.current?.focus();
    
    // Add welcome message
    setMessages([{
      role: 'assistant',
      content: 'Привет! Я готов помочь вам с аудио файлами. Загрузите аудио файл или задайте мне вопросы!',
      timestamp: new Date().toISOString(),
    }]);

    return () => clearTimeout(timer);
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleVoiceMessageComplete(audioBlob);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Ошибка при запуске записи. Пожалуйста, проверьте разрешения микрофона.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

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
      // Use the new general chat endpoint
      const response = await api.sendGeneralMessage(inputMessage);

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

  const handleVoiceMessageComplete = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    
    try {
      // Convert webm to mp3 for better compatibility
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');
      
      const response = await fetch('/api/audio/transcript/', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Transcription failed');
      }
      
      const result = await response.json();
      const transcript = result.transcript || 'No transcript available';
      
      // Add the voice message as a user message
      const userMessage: ChatMessage = {
        role: 'user',
        content: `🎤 ${transcript}`,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, userMessage]);

      // Process the voice message using general chat
      setIsLoading(true);
      try {
        const chatResponse = await api.sendGeneralMessage(transcript);

        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: chatResponse.answer,
          timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, assistantMessage]);
      } catch (error) {
        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: 'Извините, произошла ошибка при обработке голосового сообщения. Пожалуйста, попробуйте еще раз.',
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
      
    } catch (error) {
      console.error('Error transcribing audio:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Ошибка при транскрипции голосового сообщения. Пожалуйста, попробуйте еще раз.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleEditNote = () => {
    setIsEditingNote(true);
    setOriginalNote(noteContent);
  };

  const handleConfirmEdit = async () => {
    if (!noteContent.trim()) return;

    setIsLoading(true);
    try {
      const response = await api.sendGeneralMessage(`Пожалуйста, улучши и отредактируй эту заметку: ${noteContent}`);
      
      setNoteContent(response.answer);
      setIsEditingNote(false);
      
      const successMessage: ChatMessage = {
        role: 'assistant',
        content: '✅ Заметка успешно отредактирована с помощью ИИ!',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, successMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Ошибка при редактировании заметки. Пожалуйста, попробуйте еще раз.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setNoteContent(originalNote);
    setIsEditingNote(false);
  };

  return (
    <div 
      className={`flex flex-col h-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg shadow-lg transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${className}`}
    >
      {/* Header */}
      <div className="bg-white/20 text-white p-4 rounded-t-lg">
        <h2 className="text-xl font-semibold">AI Аудио Ассистент</h2>
        <p className="text-sm opacity-90">Задавайте вопросы или используйте голосовые сообщения</p>
      </div>

      {/* Messages */}
      <MessageList messages={messages} />

      {/* Note Editor */}
      <div className="border-t border-white/20 p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-medium">Заметки</h3>
          <button
            onClick={handleEditNote}
            disabled={isEditingNote || isLoading}
            className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            <Edit3 className="w-4 h-4" />
            <span>Редактировать с ИИ</span>
          </button>
        </div>
        
        <textarea
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          placeholder="Введите вашу заметку здесь..."
          className="w-full h-24 px-3 py-2 bg-white/20 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-white placeholder-white/70 resize-none"
          disabled={isLoading}
        />
        
        {isEditingNote && (
          <div className="flex space-x-2 mt-2">
            <button
              onClick={handleConfirmEdit}
              disabled={isLoading}
              className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              <Check className="w-4 h-4" />
              <span>Подтвердить</span>
            </button>
            <button
              onClick={handleCancelEdit}
              disabled={isLoading}
              className="flex items-center space-x-1 px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              <X className="w-4 h-4" />
              <span>Отмена</span>
            </button>
          </div>
        )}
      </div>

      {/* Text Input with Microphone Button */}
      <div className="border-t border-white/20 p-4">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Введите ваше сообщение..."
            className="flex-1 px-4 py-2 bg-white/20 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-white placeholder-white/70"
            disabled={isLoading || isRecording || isTranscribing}
          />
          
          {/* Microphone Button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isLoading || isTranscribing}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isRecording 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isRecording ? 'Остановить запись' : 'Начать запись голоса'}
          >
            {isTranscribing ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : isRecording ? (
              <div className="w-5 h-5 bg-white rounded-full animate-pulse" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>
          
          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading || isRecording || isTranscribing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        
        {/* Recording Status */}
        {isRecording && (
          <div className="flex items-center justify-center mt-2">
            <div className="animate-pulse bg-red-500 w-3 h-3 rounded-full mr-2"></div>
            <span className="text-white/80 text-sm">Запись голоса...</span>
          </div>
        )}
        
        {isTranscribing && (
          <div className="flex items-center justify-center mt-2">
            <Loader className="w-4 h-4 animate-spin mr-2 text-white/80" />
            <span className="text-white/80 text-sm">Транскрипция...</span>
          </div>
        )}
      </div>
    </div>
  );
}; 