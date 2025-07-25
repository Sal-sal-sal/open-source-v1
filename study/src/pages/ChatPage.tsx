/// <reference types="vite/client" />
import React, { useState, useRef, useEffect } from 'react';
import { authFetch, clearToken } from '../utils/auth';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import DocumentView from './DocumentView';
import BookChatPage from './BookChatPage';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import { RefreshCw, ThumbsUp, ThumbsDown, Copy } from 'lucide-react';
import { useChat } from '../contexts/ChatContext';
import { useIdle } from '../hooks/useIdle';
import Starfield from '../components/Starfield';
import VideoUrlModal from '../components/VideoUrlModal';
import AudioPage from './AudioPage';
import CreateNotesButton from '../components/CreateNotesButton';

// --- TYPE DEFINITIONS ---


interface Message {
  id: string; // Changed from number to string for UUIDs
  text: string;
  sender: 'user' | 'assistant';
  timestamp: string;
}

interface ChatSummary {
  id: string;
  created_at: string;
}

interface Chat {
  id: string;
  name: string | null;
  isEditing?: boolean;
}

// Backend API base (override with VITE_API_URL)
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// --- SUB-COMPONENTS ---

interface IntroViewProps {
  inputValue: string;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  onSubmit: (e: React.FormEvent) => void;
  onVideo: () => void;
  onDocument: () => void;
  onBookChat: () => void;
  onAudio: () => void;
}

const IntroView: React.FC<IntroViewProps> = ({ inputValue, setInputValue, onSubmit, onVideo, onDocument, onBookChat, onAudio }) => {
  const { t } = useTranslation();
  const [textis, setTextis] = useState(false);
  return (
    <div className="flex flex-col items-center w-full gap-8">
      <form onSubmit={onSubmit} className="w-full max-w-lg relative ">        
        <input
          type="text"
          placeholder={t('AskSomething') || 'Спроси что-нибудь!'}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setTextis(e.target.value.length > 0);
          }}
          className="bg-gray-200 dark:bg-slate-800 text-gray-900 dark:text-white w-full rounded-full py-4 pl-6 pr-16 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-lg"
        />
        {textis && (
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-cyan-100 hover:bg-[#a9b8c2] text-black p-2 rounded-full transition-colors w-10 h-10 flex items-center justify-center"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              style={{ transform: 'rotate(270deg)' }} // лучше задать через стиль
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M2 12h17m-7-7l7 7-7 7"
              />
            </svg>
          </button>
        )}
        {textis ? (
           
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-cyan-100 hover:bg-[#a9b8c2] text-black p-2 rounded-full transition-colors w-10 h-10 flex items-center justify-center"
          >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            style={{ transform: 'rotate(270deg)' }} // лучше задать через стиль
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M2 12h17m-7-7l7 7-7 7"
            />
          </svg>
        </button>
        ) : (
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-cyan-100 hover:bg-[#a9b8c2] text-black p-2 rounded-full transition-colors w-10 h-10 flex items-center justify-center"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              style={{ transform: 'rotate(270deg)' }} // лучше задать через стиль
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M2 12h17m-7-7l7 7-7 7"
              />
            </svg>
          </button>
        )}
      </form>
      <div className="flex gap-6">
        <button onClick={onVideo} className="flex flex-col items-center justify-center gap-3 bg-gray-900 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 w-32 h-32 rounded-lg transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400  hover:text-cyan-500">
            <path d="M21.5 8.1c-.2-1.3-.8-2.3-2.3-2.6C16.8 5 12 5 12 5s-4.8 0-7.2.5c-1.5.3-2.1 1.3-2.3 2.6C2.5 9.4 2.5 12 2.5 12s0 2.6.5 3.9c.2 1.3.8 2.3 2.3 2.6 2.4.5 7.2.5 7.2.5s4.8 0 7.2-.5c1.5-.3 2.1-1.3 2.3-2.6.5-1.3.5-3.9.5-3.9s0-2.6-.5-3.9z"></path>
            <polygon points="10 9 15 12 10 15"></polygon>
          </svg>
          <span className="text-gray-800 dark:text-gray-200 font-medium">{t('Video')}</span>
        </button>
        <button onClick={onDocument} className="flex flex-col items-center justify-center gap-3 bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 w-32 h-32 rounded-lg transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          <span className="text-gray-800 dark:text-gray-200 font-medium">{t('Document')}</span>
        </button>
        <button onClick={onAudio} className="flex flex-col items-center justify-center gap-3 bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 w-32 h-32 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line> 
            </svg>
            <span className="text-gray-800 dark:text-gray-200 font-medium">{t('Audio')}</span>
        </button>

      </div>
    </div>
  );
};

// Renders a single message in the chat log
const ChatMessage: React.FC<{ message: Message }> = ({ message }) => {
  const isAssistant = message.sender === 'assistant';
  return (
    <div className={`py-4 ${isAssistant ? '' : ''}`}>
      <div className="max-w-4xl mx-auto">
        <div className={`flex items-start gap-4 px-4 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
          <div className={`group relative ${isAssistant ? '' : 'order-2'}`}>
            <div className={`px-4 py-2 rounded-lg text-white ${isAssistant ? '' : 'bg-gray-700'}`}>
              <ReactMarkdown>{message.text}</ReactMarkdown>
            </div>
            {isAssistant && (
              <div className="absolute -bottom-8 left-0 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1 hover:bg-gray-700 rounded"><RefreshCw size={16} /></button>
                <button className="p-1 hover:bg-gray-700 rounded"><ThumbsUp size={16} /></button>
                <button className="p-1 hover:bg-gray-700 rounded"><ThumbsDown size={16} /></button>
                <button className="p-1 hover:bg-gray-700 rounded"><Copy size={16} /></button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


// --- MAIN CHAT PAGE COMPONENT ---

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const chatId = searchParams.get('chat_id');
  const { createChat } = useChat();
  const [isDocumentMode, setIsDocumentMode] = useState(false);
  const [isBookChatMode, setIsBookChatMode] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isAudioMode, setIsAudioMode] = useState(false);
  const { t } = useTranslation();
  const isIdle = useIdle(15000); // 15 seconds
  const showIntro = !chatId;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const openChat = async (id: string) => {
      try {
        const res = await authFetch(`${API_BASE}/api/chat/${id}/messages`);
        if (res.status === 401) {
          clearToken();
          navigate('/login');
          throw new Error('Unauthorized');
        }
        const data = await res.json();
        const formatted: Message[] = data.map((m: any, idx: number) => ({
          id: m.id || crypto.randomUUID(),
          text: m.content || '',
          sender: m.role === 'assistant' ? 'assistant' : 'user',
          timestamp: '',
        }));
        setMessages(formatted);
      } catch (err) {
        console.error('Failed to load chat messages', err);
      }
    };
    
    const pendingMessage = sessionStorage.getItem('pendingMessage');
    const pendingVideoUrl = sessionStorage.getItem('pendingVideoUrl');

    if (chatId && pendingVideoUrl) {
        sessionStorage.removeItem('pendingVideoUrl');
        fetchVideoSummary(pendingVideoUrl, chatId, true);
    } else if (chatId && pendingMessage) {
      sessionStorage.removeItem('pendingMessage');
      const userMessage: Message = {
        id: crypto.randomUUID(),
        text: pendingMessage,
        sender: 'user',
        timestamp: getFormattedTimestamp(),
      };
      setMessages([userMessage]);
      streamAIResponse(pendingMessage, chatId);
    } else if (chatId) {
        openChat(chatId);
    }
    else {
        setMessages([]);
    }
  }, [chatId, navigate]);

  useEffect(() => {
    if (isAudioMode) {
      navigate('/audio');
    }
  }, [isAudioMode, navigate]);

  const getFormattedTimestamp = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const fetchVideoSummary = async (url: string, forChatId: string, isNewChat: boolean) => {
    if (!isNewChat) {
        const userMessage: Message = {
            id: crypto.randomUUID(),
            text: `Get summary for YouTube video: ${url}`,
            sender: 'user',
            timestamp: getFormattedTimestamp(),
        };
        setMessages((prev) => [...prev, userMessage]);
    }

    const loadingMessageId = crypto.randomUUID();
    setMessages((prev) => [...prev, {
        id: loadingMessageId,
        text: 'Working on that summary...',
        sender: 'assistant',
        timestamp: getFormattedTimestamp(),
    }]);

    try {
        const res = await authFetch(`${API_BASE}/video/summary`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: forChatId, url }),
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ detail: 'An unknown error occurred.' }));
            throw new Error(errorData.detail);
        }

        const data = await res.json();
        const summary = data.summary || 'Could not find summary in response.';

        setMessages((prev) => prev.map(m =>
            m.id === loadingMessageId ? { ...m, text: summary } : m
        ));
    } catch (err) {
        console.error("Video summary request failed", err);
        setMessages((prev) => prev.map(m =>
            m.id === loadingMessageId ? { ...m, text: `Error: ${(err as Error).message}` } : m
        ));
    }
  };

  const handleVideoSummarySubmit = async (url: string) => {
    setIsVideoModalOpen(false);
    if (chatId) {
        fetchVideoSummary(url, chatId, false);
    } else {
        sessionStorage.setItem('pendingVideoUrl', url);
        await createChat(`Summary for: ${url}`);
    }
  };
  
  const streamAIResponse = async (prompt: string, id: string) => {
    // 1. Add a placeholder for the assistant's response
    const assistantId = crypto.randomUUID();
    const assistantResponsePlaceholder: Message = {
      id: assistantId,
      text: '',
      sender: 'assistant',
      timestamp: getFormattedTimestamp(),
    };
    setMessages((prev) => [...prev, assistantResponsePlaceholder]);

    try {
      // 2. Fetch the streaming response
      const res = await authFetch(`${API_BASE}/api/chat/${id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: prompt }),
      });

      if (res.status === 401) {
        clearToken();
        navigate('/login');
        return;
      }

      if (!res.body) {
        throw new Error('Response body is null');
      }

      // 3. Read the stream
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;
        
        // 4. Update the placeholder message with the new chunk
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId ? { ...msg, text: fullResponse } : msg
          )
        );
      }

      // After streaming, if it was the first message, generate a title
      if (messages.length === 1) { // This check might need refinement
         try {
            await authFetch(`${API_BASE}/api/chat/${id}/generate-title`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_first_message: prompt }),
            });
            // Optionally, refresh chat list here if it's visible
         } catch (titleError) {
             console.error("Failed to generate chat title", titleError);
         }
      }

    } catch (err) {
      console.error('AI request failed', err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? { ...msg, text: 'Error: Could not fetch response.' }
            : msg
        )
      );
    }
  };


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() === '') return;

    const userPrompt = inputValue;
    setInputValue('');

    if (!chatId) {
      await createChat(userPrompt);
    } else {
      const userMessage: Message = {
        id: crypto.randomUUID(),
        text: userPrompt,
        sender: 'user',
        timestamp: getFormattedTimestamp()
      };
      setMessages((prev) => [...prev, userMessage]);
      await streamAIResponse(userPrompt, chatId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (isDocumentMode) {
    return <DocumentView />;
  }

  if (isBookChatMode) {
    return <BookChatPage />;
  }

  if (isAudioMode) {
    return null; // Or a loading spinner, since the useEffect will navigate away
  }

  return (
    <div className="flex h-screen bg-[#1b1b1b] text-white">
      <div 
        className={`fixed inset-0 transition-opacity duration-1000 pointer-events-none ${isIdle ? 'opacity-100' : 'opacity-0'}`}
        style={{ zIndex: 10 }}
      >
        {isIdle && <Starfield />}
      </div>
      <div className="flex-1 flex flex-col">
        {showIntro ? (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <IntroView
              inputValue={inputValue}
              setInputValue={setInputValue}
              onSubmit={handleSendMessage}
              onVideo={() => setIsVideoModalOpen(true)}
              onDocument={() => setIsDocumentMode(true)}
              onBookChat={() => setIsBookChatMode(true)}
              onAudio={() => setIsAudioMode(true)}
            />
          </div>
        ) : (
          <>
            <button 
              onClick={() => navigate(-1)} // Возвращение на предыдущую страницу
              className="absolute top-4 left-4 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-white dark:bg-white text-gray-900 dark:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-100 shadow-md"
              aria-label="Go back"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/> {/* Стрелка вверх */}
              </svg>
            </button>
            <div className="flex-1 overflow-y-scroll min-h-0 pt-4">
              {messages.map((msg) => (<ChatMessage key={msg.id} message={msg} />))}
              <div ref={chatEndRef} />
            </div>
            <div className="p-4 pt-2">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-2 mb-2">
                  {chatId && messages.length > 0 && (
                    <CreateNotesButton
                      chatId={chatId}
                      chatType="chat"
                      onSuccess={() => {
                        // Можно добавить уведомление об успехе
                        console.log('Notes created successfully');
                      }}
                      onError={(error) => {
                        console.error('Failed to create notes:', error);
                      }}
                    />
                  )}
                </div>
                <form onSubmit={handleSendMessage} className="relative flex items-end">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('AskSomething') || 'Спроси что-нибудь!'}
                    rows={1}
                    className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg py-3 pl-4 pr-12 resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-cyan-500 leading-tight mr-2"
                    style={{ maxHeight: '200px' }}
                  />
                  <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 bg-cyan-500 hover:bg-cyan-600 text-black p-2 rounded-full transition-colors w-10 h-10 flex items-center justify-center">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" transform="rotate(270 12 12)"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14m-7-7l7 7-7 7"/></svg>
                  </button>
                </form>
              </div>
            </div>
          </>
        )}
      </div>
      <VideoUrlModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        onSubmit={handleVideoSummarySubmit}
      />
    </div>
  );
};

export default ChatPage; 