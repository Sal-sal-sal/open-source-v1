import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { FaPlay, FaPause, FaRedo, FaUndo } from 'react-icons/fa';
import { Send, Loader, Mic, Edit3, Check, X } from 'lucide-react';
import { authFetch } from '../utils/auth';
import CreateNotesButton from '../components/CreateNotesButton';
import VoiceRecorder from '../components/VoiceRecorder';
import NotesCreatedModal from '../components/NotesCreatedModal';
import { MessageList } from '../components/MessageList';
import { api } from '../api/client';
import type { ChatMessage } from '../types';
import { getGradient } from '../utils/gradients';

interface AudioChatDetails {
  name: string;
  file_id: string;
}

interface CreatedNote {
  id?: number;
  title: string;
  meaning: string;
  association: string;
  personal_relevance: string;
  importance: string;
  implementation_plan: string;
  user_question?: string;
  created_at?: string;
}

const AudioChatView: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const [chatDetails, setChatDetails] = useState<AudioChatDetails | null>(null);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [voiceMessageError, setVoiceMessageError] = useState<string | null>(null);
  const [voiceMessageSuccess, setVoiceMessageSuccess] = useState<string | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [createdNote, setCreatedNote] = useState<CreatedNote | null>(null);
  const [isCreatingNotes, setIsCreatingNotes] = useState(false);
  const timelineRef = useRef<HTMLInputElement>(null);
  
  // Chat interface states
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [originalNote, setOriginalNote] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioTranscript, setAudioTranscript] = useState<string>('');
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
      content: 'Привет! Я готов помочь вам с аудио файлами. Задавайте вопросы или используйте голосовые сообщения!',
      timestamp: new Date().toISOString(),
    }]);

    return () => clearTimeout(timer);
  }, []);

  // Function to get audio transcript
  const getAudioTranscript = async (fileId: string) => {
    try {
      const response = await authFetch(`/api/audio/transcript/${fileId}`, {
        method: 'GET',
      });
      
      if (response.ok) {
        const result = await response.json();
        const transcript = result.transcript || '';
        setAudioTranscript(transcript);
        
        // Add transcript to chat context
        if (transcript) {
          const transcriptMessage: ChatMessage = {
            role: 'assistant',
            content: `📖 **Транскрипция аудио файла:**\n\n${transcript}\n\nТеперь я знаю содержание аудио и могу отвечать на ваши вопросы о нем!`,
            timestamp: new Date().toISOString(),
          };
          setMessages(prev => [...prev, transcriptMessage]);
        }
      } else {
        console.error('Failed to get audio transcript:', response.status, response.statusText);
        // Don't show error to user, just log it
      }
    } catch (error) {
      console.error('Error getting audio transcript:', error);
      // Don't show error to user, just log it
    }
  };

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
      // Create context with audio transcript and chat history
      const contextMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Add current user message
      contextMessages.push({
        role: 'user',
        content: inputMessage
      });

      // Add audio context if available
      let enhancedMessage = inputMessage;
      if (audioTranscript) {
        enhancedMessage = `Контекст аудио файла: ${audioTranscript}\n\nВопрос пользователя: ${inputMessage}`;
      }

      // Use the new general chat endpoint with context
      const response = await api.sendGeneralMessage(enhancedMessage);

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
      
      const response = await authFetch('/api/audio/transcript/', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Transcription failed:', response.status, errorText);
        throw new Error(`Transcription failed: ${response.status} - ${errorText}`);
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

      // Process the voice message using general chat with context
      setIsLoading(true);
      try {
        // Create enhanced message with audio context
        let enhancedTranscript = transcript;
        if (audioTranscript) {
          enhancedTranscript = `Контекст аудио файла: ${audioTranscript}\n\nГолосовое сообщение пользователя: ${transcript}`;
        }

        const chatResponse = await api.sendGeneralMessage(enhancedTranscript);

        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: chatResponse.answer,
          timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, assistantMessage]);
      } catch (error) {
        console.error('Error processing voice message with AI:', error);
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
      // Include audio context in note editing
      let enhancedNoteContent = noteContent;
      if (audioTranscript) {
        enhancedNoteContent = `Контекст аудио файла: ${audioTranscript}\n\nЗаметка для редактирования: ${noteContent}`;
      }

      const response = await api.sendGeneralMessage(`Пожалуйста, улучши и отредактируй эту заметку: ${enhancedNoteContent}`);
      
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

  useEffect(() => {
    if (!chatId) return;

    const fetchChatAndAudio = async () => {
      try {
        // First, get the chat details to find the file_id
        const chatResponse = await apiClient.get(`/api/audio-chats/${chatId}`);
        const details = chatResponse.data;
        setChatDetails(details);

        // Then, fetch the audio file using authFetch, which adds the Bearer token
        const audioResponse = await authFetch(`/api/audio/file/${details.file_id}`);
        if (!audioResponse.ok) {
          throw new Error('Could not fetch audio file. Please ensure you are logged in.');
        }
        
        // Create a local URL for the audio blob to use in the <audio> tag
        const audioBlob = await audioResponse.blob();
        const localAudioUrl = URL.createObjectURL(audioBlob);
        setAudioSrc(localAudioUrl);

        // Get audio transcript for context
        await getAudioTranscript(details.file_id);

      } catch (err) {
        setError('Failed to load audio chat session.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchChatAndAudio();

    // Cleanup the blob URL when the component unmounts
    return () => {
        if (audioSrc) {
            URL.revokeObjectURL(audioSrc);
        }
    };
  }, [chatId]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleTimelineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Number(e.target.value);
      setProgress(Number(e.target.value));
    }
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleRewind = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime -= seconds;
    }
  };

  const handleForward = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime += seconds;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleVoiceMessageCompleteOld = async (audioBlob: Blob, transcript: string) => {
    try {
      // Create a FormData with the audio blob
      const formData = new FormData();
      formData.append('file', audioBlob, 'voice_message.webm');
      
      // Upload the voice message
      const uploadResponse = await authFetch('/api/audio/load', {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Upload response error:', uploadResponse.status, errorText);
        throw new Error(`Failed to upload voice message: ${uploadResponse.status} - ${errorText}`);
      }
      
      const uploadResult = await uploadResponse.json();
      const fileId = uploadResult.file_id;
      
      // Create notes from the transcript
      if (chatId) {
        try {
          // Create note from voice message using the new endpoint
          const noteFormData = new FormData();
          noteFormData.append('voice_file', audioBlob, 'voice_message.webm');
          noteFormData.append('note_title', `Голосовая заметка - ${new Date().toLocaleString()}`);
          noteFormData.append('note_content', `Создано из голосового сообщения в чате: ${chatDetails?.name || 'Неизвестно'}\n\nТранскрипция: ${transcript}\n\nПожалуйста, создай структурированную заметку на основе этого голосового сообщения, включая:\n- Основные идеи и концепции\n- Личные ассоциации и связи\n- Практическое применение\n- Важность для обучения`);
          noteFormData.append('tags', 'voice,auto-generated,ai-structured');
          
          const noteResponse = await authFetch('/api/voice-notes/create-from-voice-message/', {
            method: 'POST',
            body: noteFormData,
          });
          
          if (noteResponse.ok) {
            const noteResult = await noteResponse.json();
            setVoiceMessageSuccess(`✅ Voice message processed and note created! Transcript: "${transcript}"`);
            console.log('Note created successfully:', noteResult);
            
            // Show created note in modal
            if (noteResult.note) {
              setCreatedNote(noteResult.note);
              setShowNotesModal(true);
            }
            
            // Also try to create a combined note with the audiobook transcript if available
            if (chatDetails?.file_id) {
              try {
                console.log('Attempting to create combined note with file_id:', chatDetails.file_id);
                const combinedFormData = new FormData();
                combinedFormData.append('voice_file', audioBlob, 'voice_message.webm');
                combinedFormData.append('transcript_file_id', chatDetails.file_id);
                combinedFormData.append('note_title', `Комбинированная заметка - ${new Date().toLocaleString()}`);
                combinedFormData.append('note_content', `Комбинированная заметка из аудиокниги "${chatDetails.name}" и голосового сообщения\n\nГолосовое сообщение: ${transcript}\n\nПожалуйста, создай структурированную заметку, объединяющую:\n- Основные идеи из аудиокниги\n- Личные мысли из голосового сообщения\n- Связи между контентом\n- Практическое применение\n- Важность для обучения`);
                combinedFormData.append('tags', 'voice,audiobook,combined,ai-structured');
                
                const combinedResponse = await authFetch('/api/voice-notes/create-from-voice-and-transcript/', {
                  method: 'POST',
                  body: combinedFormData,
                });
                
                if (combinedResponse.ok) {
                  const combinedResult = await combinedResponse.json();
                  console.log('Combined note created successfully:', combinedResult);
                  setVoiceMessageSuccess(`✅ Voice message processed! Note created + Combined note with audiobook!`);
                } else {
                  const errorText = await combinedResponse.text();
                  console.log('Combined note creation failed:', combinedResponse.status, errorText);
                  setVoiceMessageSuccess(`✅ Voice message processed! Note created! (Combined note failed: ${errorText})`);
                }
              } catch (combinedError) {
                console.log('Combined note creation skipped:', combinedError);
                setVoiceMessageSuccess(`✅ Voice message processed! Note created! (Combined note failed)`);
              }
            }
          } else {
            const errorText = await noteResponse.text();
            console.error('Note creation error:', noteResponse.status, errorText);
            setVoiceMessageSuccess(`Voice message processed! Transcript: "${transcript}" (Note creation failed)`);
          }
        } catch (noteError) {
          console.error('Error creating note:', noteError);
          setVoiceMessageSuccess(`Voice message processed! Transcript: "${transcript}" (Note creation failed)`);
        }
        
        setVoiceMessageError(null);
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setVoiceMessageSuccess(null);
        }, 5000);
      }
      
    } catch (error) {
      console.error('Error processing voice message:', error);
      setVoiceMessageError('Failed to process voice message. Please try again.');
      setVoiceMessageSuccess(null);
    }
  };

  const handleVoiceMessageError = (error: string) => {
    setVoiceMessageError(error);
    setVoiceMessageSuccess(null);
  };

  const handleNotesModalClose = () => {
    setShowNotesModal(false);
    setCreatedNote(null);
  };

  const handleNoteUpdate = async (updatedNote: CreatedNote) => {
    try {
      // Update note via API if needed
      console.log('Note updated:', updatedNote);
      setCreatedNote(updatedNote);
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const handleCreateNotes = async () => {
    if (!chatId || isCreatingNotes) return;
    
    setIsCreatingNotes(true);
    try {
      // Create notes from chat history using the notes utility
      const { createNotesFromChatHistory } = await import('../utils/notes');
      const note = await createNotesFromChatHistory(chatId, 'audio_chat', progress);
      
      // Convert StructuredNote to CreatedNote format
      const createdNote: CreatedNote = {
        title: note.title,
        meaning: note.meaning,
        association: note.association,
        personal_relevance: note.personal_relevance,
        importance: note.importance,
        implementation_plan: note.implementation_plan || '',
      };
      
      // Set the created note and show modal
      setCreatedNote(createdNote);
      setShowNotesModal(true);
      
      // Add success message to chat
      const successMessage: ChatMessage = {
        role: 'assistant',
        content: '✅ Заметка успешно создана с помощью ИИ! Нажмите на кнопку "Заметки" чтобы просмотреть.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, successMessage]);
      
    } catch (error) {
      console.error('Error creating notes:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: '❌ Ошибка при создании заметки. Пожалуйста, попробуйте еще раз.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsCreatingNotes(false);
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
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
        <div className="relative z-20 text-white text-xl">Loading Audio...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
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
        <div className="relative z-20 text-red-300 text-xl">{error}</div>
      </div>
    );
  }

  if (!chatDetails) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
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
        <div className="relative z-20 text-white text-xl">Audio chat not found.</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen p-4 flex flex-col items-center justify-center overflow-hidden">
      {/* Main content with conditional blur */}
      <div className={`absolute inset-0 transition-all duration-300 ${showNotesModal ? 'blur-sm' : ''}`}>
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
      </div>
      
      {/* Контент */}
      <div className={`relative z-20 flex flex-col lg:flex-row items-center justify-center w-full max-w-7xl gap-8 transition-all duration-1000 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}>
        {/* Левая часть - Аудио плеер */}
        <div className={`w-full lg:w-1/2 transition-all duration-700 ease-out delay-200 ${
          isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
        }`}>
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">{chatDetails.name}</h2>
            <p className="text-lg text-white/80">Аудио плеер с интерактивным чатом</p>
          </div>
          
          {audioSrc && (
            <>
              <audio 
                ref={audioRef}
                src={audioSrc}
                className="w-full hidden"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
              />

              <div className={`backdrop-blur-sm bg-white/10 border border-white/20 p-6 rounded-lg shadow-lg transition-all duration-700 ease-out delay-300 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}>
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-sm text-white">{formatTime(progress)}</span>
                  <input
                    ref={timelineRef}
                    type="range"
                    value={progress}
                    max={duration || 0}
                    onChange={handleTimelineChange}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-sm text-white">{formatTime(duration)}</span>
                </div>
                <div className={`flex items-center justify-center gap-4 mt-4 transition-all duration-700 ease-out delay-400 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}>
                  <button onClick={() => handleRewind(10)} className="text-2xl text-white hover:text-blue-300 transition-colors">
                    <div className="relative">
                      <FaUndo />
                      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-white">10</span>
                    </div>
                  </button>
                  <button onClick={handlePlayPause} className="text-4xl bg-blue-500 text-white w-16 h-16 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                    {isPlaying ? <FaPause /> : <FaPlay />}
                  </button>
                  <button onClick={() => handleForward(30)} className="text-2xl text-white hover:text-blue-300 transition-colors">
                    <div className="relative">
                      <FaRedo />
                      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-white">30</span>
                    </div>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Правая часть - Красивый чат интерфейс */}
        <div className={`w-full lg:w-1/2 h-96 lg:h-[600px] transition-all duration-700 ease-out delay-400 ${
          isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
        }`} style={{ maxWidth: '100%', overflow: 'hidden' }}>
          <div className={`flex flex-col h-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg shadow-lg transition-all duration-700 ease-out delay-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ maxWidth: '100%', overflow: 'hidden', minHeight: '0' }}>
            {/* Header */}
            <div className={`bg-white/20 text-white p-4 rounded-t-lg transition-all duration-700 ease-out delay-600 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`} style={{ maxWidth: '100%', overflow: 'hidden' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold" style={{ maxWidth: '100%', overflow: 'hidden', wordWrap: 'break-word' }}>AI Аудио Ассистент</h2>
                  <p className="text-sm opacity-90" style={{ maxWidth: '100%', overflow: 'hidden', wordWrap: 'break-word' }}>Задавайте вопросы или используйте голосовые сообщения</p>
                </div>
                <div className="flex items-center gap-2">
                  <CreateNotesButton
                    chatId={chatId || ''}
                    chatType="audio_chat"
                    currentTime={progress}
                    onSuccess={() => {
                      // Success is handled in handleCreateNotes
                    }}
                    onError={(error) => {
                      console.error('Create notes error:', error);
                      const errorMessage: ChatMessage = {
                        role: 'assistant',
                        content: `❌ Ошибка при создании заметки: ${error}`,
                        timestamp: new Date().toISOString(),
                      };
                      setMessages(prev => [...prev, errorMessage]);
                    }}
                    className="bg-blue-600/80 text-white border border-blue-400/30 hover:bg-blue-700/80"
                    disabled={isCreatingNotes || !chatId}
                  />
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className={`flex-1 transition-all duration-700 ease-out delay-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`} style={{ 
              maxWidth: '100%', 
              overflow: 'hidden', 
              minHeight: '0', 
              flex: '1 1 auto',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <MessageList messages={messages} />
            </div>

            {/* Note Editor */}
            <div className={`border-t border-white/20 p-4 transition-all duration-700 ease-out delay-800 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`} style={{ maxWidth: '100%', overflow: 'hidden' }}>
              <div className="flex items-center justify-between mb-2" style={{ maxWidth: '100%', overflow: 'hidden' }}>
                <h3 className="text-white font-medium" style={{ maxWidth: '100%', overflow: 'hidden', wordWrap: 'break-word' }}>Заметки</h3>
                <button
                  onClick={handleEditNote}
                  disabled={isEditingNote || isLoading}
                  className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  style={{ flexShrink: '0', minWidth: 'fit-content' }}
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Редактировать с ИИ</span>
                </button>
              </div>
              
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Введите вашу заметку здесь..."
                className="w-full h-24 px-3 py-2 bg-white/20 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-white placeholder-white/70 resize-none overflow-hidden"
                style={{
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  boxSizing: 'border-box',
                  width: '100%',
                  minWidth: '0'
                }}
                disabled={isLoading}
              />
              
              {isEditingNote && (
                <div className="flex space-x-2 mt-2" style={{ maxWidth: '100%', overflow: 'hidden' }}>
                  <button
                    onClick={handleConfirmEdit}
                    disabled={isLoading}
                    className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    style={{ flexShrink: '0' }}
                  >
                    <Check className="w-4 h-4" />
                    <span>Подтвердить</span>
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={isLoading}
                    className="flex items-center space-x-1 px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    style={{ flexShrink: '0' }}
                  >
                    <X className="w-4 h-4" />
                    <span>Отмена</span>
                  </button>
                </div>
              )}
            </div>

            {/* Text Input with Microphone Button */}
            <div className={`border-t border-white/20 p-4 transition-all duration-700 ease-out delay-900 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`} style={{ maxWidth: '100%', overflow: 'hidden' }}>
              <div className="flex space-x-2" style={{ maxWidth: '100%', overflow: 'hidden' }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Введите ваше сообщение..."
                  className="flex-1 px-4 py-2 bg-white/20 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-white placeholder-white/70 overflow-hidden"
                  style={{
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                    width: '100%',
                    minWidth: '0',
                    flex: '1 1 auto'
                  }}
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
                  style={{ flexShrink: '0', minWidth: 'fit-content' }}
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
                  style={{ flexShrink: '0', minWidth: 'fit-content' }}
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
                <div className="flex items-center justify-center mt-2" style={{ maxWidth: '100%', overflow: 'hidden' }}>
                  <div className="animate-pulse bg-red-500 w-3 h-3 rounded-full mr-2"></div>
                  <span className="text-white/80 text-sm" style={{ maxWidth: '100%', overflow: 'hidden', wordWrap: 'break-word' }}>Запись голоса...</span>
                </div>
              )}
              
              {isTranscribing && (
                <div className="flex items-center justify-center mt-2" style={{ maxWidth: '100%', overflow: 'hidden' }}>
                  <Loader className="w-4 h-4 animate-spin mr-2 text-white/80" />
                  <span className="text-white/80 text-sm" style={{ maxWidth: '100%', overflow: 'hidden', wordWrap: 'break-word' }}>Транскрипция...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Notes Created Modal */}
      <NotesCreatedModal
        isOpen={showNotesModal}
        onClose={handleNotesModalClose}
        createdNote={createdNote}
        onNoteUpdate={handleNoteUpdate}
      />
    </div>
  );
};

export default AudioChatView;