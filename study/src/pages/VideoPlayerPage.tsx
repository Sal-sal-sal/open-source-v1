import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Play, Pause, Volume2, VolumeX, ArrowLeft, MessageCircle } from 'lucide-react';
import { authFetch } from '../utils/auth';
import { getGradient } from '../utils/gradients';

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  viewCount: string;
  likeCount: string;
  duration: string;
  url: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: string;
}

const VideoPlayerPage: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const [video, setVideo] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (videoId) {
      fetchVideoInfo(videoId);
    }
  }, [videoId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchVideoInfo = async (id: string) => {
    try {
      const response = await authFetch(`/api/video/info?video_id=${id}`);
      const data = await response.json();
      setVideo(data);
      
      // Add initial AI message about the video
      const initialMessage: Message = {
        id: crypto.randomUUID(),
        text: `Привет! Я готов помочь вам с видео "${data.title}" от ${data.channelTitle}. Что вас интересует?`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([initialMessage]);
    } catch (error) {
      console.error('Error fetching video info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !video) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsSending(true);

    try {
      // Send message to AI with video context
      const response = await authFetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `О видео "${video.title}": ${inputValue}`,
          video_context: {
            title: video.title,
            description: video.description,
            channel: video.channelTitle,
            url: video.url
          }
        }),
      });

      const data = await response.json();
      
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        text: data.response || 'Извините, не удалось получить ответ.',
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        text: 'Извините, произошла ошибка при отправке сообщения.',
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen ${getGradient('videoPlayer')} flex items-center justify-center`}>
        <div className="text-white text-xl">Загрузка видео...</div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className={`min-h-screen ${getGradient('videoPlayer')} flex items-center justify-center`}>
        <div className="text-white text-xl">Видео не найдено</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex">
      {/* Видео фон Марио */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{ filter: 'brightness(0.3)' }}
      >
        <source src="/resurses/videomarie.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Затемнение поверх видео */}
      <div className="absolute inset-0 bg-black/40 z-10"></div>
      
      {/* Контент */}
      <div className="relative z-20 flex w-full">
      {/* Video Section */}
      <div className="flex-1 p-6">
        <div className="mb-4">
          <button
            onClick={() => navigate('/video')}
            className="flex items-center text-white hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="mr-2" />
            Назад к поиску
          </button>
        </div>

        {/* Video Player */}
        <div className="bg-black rounded-lg overflow-hidden shadow-2xl hover:scale-105 hover:shadow-purple-500/50 transition-all duration-300 ease-in-out">
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={`https://www.youtube.com/embed/${video.id}?autoplay=1&mute=1`}
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
              className="absolute top-0 left-0 w-full h-full"
            />
          </div>
        </div>

        {/* Video Info */}
        <div className="mt-6 text-white">
          <h1 className="text-2xl font-bold mb-2">{video.title}</h1>
          <div className="flex items-center space-x-4 text-gray-300 mb-4">
            <span>{video.channelTitle}</span>
            <span>•</span>
            <span>{new Date(video.publishedAt).toLocaleDateString()}</span>
            <span>•</span>
            <span>{parseInt(video.viewCount).toLocaleString()} просмотров</span>
          </div>
          <p className="text-gray-300 leading-relaxed">{video.description}</p>
        </div>
      </div>

      {/* AI Chat Section */}
      <div className="w-96 bg-black/20 backdrop-blur-sm border-l border-white/10">
        <div className="h-full flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center text-white">
              <MessageCircle className="mr-2" />
              <h2 className="font-semibold">AI Чат о видео</h2>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/10 text-white backdrop-blur-sm'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className="text-xs opacity-70 mt-1">{message.timestamp}</p>
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex justify-start">
                <div className="bg-white/10 text-white backdrop-blur-sm max-w-xs px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span className="text-sm">AI печатает...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/10">
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Задайте вопрос о видео..."
                className="flex-1 px-3 py-2 bg-white/10 text-white placeholder-gray-400 rounded-lg border border-white/20 focus:outline-none focus:border-white/40 backdrop-blur-sm"
                disabled={isSending}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isSending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default VideoPlayerPage; 