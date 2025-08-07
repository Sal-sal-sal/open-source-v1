import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { authFetch, clearToken } from '../utils/auth';
import { Orbit, Search, FileEdit, CheckSquare, Book, History, ChevronLeft, MoreHorizontal, LogOut, User, FileText, PenTool, Headphones, Play, Upload } from 'lucide-react';
import NotesModal from '../components/NotesModal';
import { ThemeToggle } from '../components/ThemeToggle';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import {
  createBookChat,
  getBookChats,
  deleteBookChat,
  deleteChat,
  renameChat,
  getChats,
} from "../utils/chat";
import { useChat } from '../contexts/ChatContext';
import { useProfile } from '../hooks/useProfile';
import { FaMusic, FaBookOpen } from 'react-icons/fa';
import CreateBookChatModal from '../components/CreateBookChatModal';

interface ChatSummary {
  id: string;
  name: string;
}

interface BookChat {
    id: string;
    name?: string;
}

interface AudioChat {
    id: string;
    name?: string;
}

interface SearchResult {
  id: string;
  name: string;
  type: "chat" | "book_chat" | "audio_chat";
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Mock user data for the profile section
// УДАЛЯЕМ ЭТОТ БЛОК ПОЛНОСТЬЮ ИЛИ КОММЕНТИРУЕМ, ЧТОБЫ ИЗБЕЖАТЬ ОШИБКИ ReferenceError
/* const mockUser = {
  username: 'Saladin',
  avatarInitial: 'S',
}; */

const SidebarLayout: React.FC = () => {
  const { t } = useTranslation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const chatId = searchParams.get('chat_id') || location.pathname.split('/').pop();

  const { bookChats, historyChats, loadChats } = useChat();
  const [currentBookChats, setCurrentBookChats] = useState(bookChats);
  const [currentHistoryChats, setCurrentHistoryChats] = useState(historyChats);
  const [audioChats, setAudioChats] = useState<AudioChat[]>([]);
  const [isLoadingAudioChats, setIsLoadingAudioChats] = useState(true);
  const { userInfo, loading: profileLoading } = useProfile(); // Использование useProfile

  useEffect(() => {
    setCurrentBookChats(bookChats);
    setCurrentHistoryChats(historyChats);
  }, [bookChats, historyChats]);

  const handleSearch = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (searchTerm.trim() === '') {
        setCurrentBookChats(bookChats);
        setCurrentHistoryChats(historyChats);
        return;
      }
      try {
        const res = await authFetch(`${API_BASE}/api/search/chats?query=${encodeURIComponent(searchTerm)}`);
        if (!res.ok) throw new Error('Failed to search chats');
        const data: SearchResult[] = await res.json();

        setCurrentBookChats(data.filter(item => item.type === 'book_chat'));
        setCurrentHistoryChats(data.filter(item => item.type === 'chat'));
      } catch (err) {
        console.error("Search failed:", err);
      }
    }
  };

  const handleAuthError = (res: Response) => {
    if (res.status === 401) {
      clearToken();
      navigate('/login');
      throw new Error('Unauthorized');
    }
  };

  const openBookChat = (id: string) => {
    navigate(`/book-chat/${id}`);
  };

  const openNormalChat = (id: string) => {
    navigate(`/chat?chat_id=${id}`);
  };

  const openAudioChat = (id: string) => {
    navigate(`/audio-chat/${id}`);
  };

  const requestNewChat = () => {
    navigate("/audio");
  };

  const handleDeleteChat = async (id: string, type: 'book' | 'history' | 'audio') => {
    if (
      !window.confirm(`Are you sure you want to delete this chat?`)
    )
      return;
    try {
      if (type === 'book') {
        await deleteBookChat(id);
      } else if (type === 'history') {
        await deleteChat(id);
      } else if (type === 'audio') {
        // TODO: Implement audio chat deletion when backend endpoint is available
        console.log("Audio chat deletion not yet implemented");
        return;
      }
      
      // Refresh the lists from the context
      await loadChats();

      if (chatId === id) {
        navigate("/chat");
      }
    } catch (err) {
      console.error("Failed to delete chat", err);
    }
  };

  const handleLogout = () => {
    clearToken();
    navigate('/login');
  };

  // Загружаем чаты при первой загрузке компонента
  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // Загружаем аудио чаты
  useEffect(() => {
    const fetchAudioChats = async () => {
      try {
        const response = await authFetch('/api/audio-chats/');
        if (response.ok) {
          const data = await response.json();
          setAudioChats(data);
        }
      } catch (err) {
        console.error("Failed to fetch audio chats:", err);
      } finally {
        setIsLoadingAudioChats(false);
      }
    };

    fetchAudioChats();
  }, []);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-[#1C1C1C] text-gray-800 dark:text-gray-300 font-sans">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-35 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`bg-gray-50 dark:bg-[#1C1C1C] transition-all duration-300 ease-in-out flex-shrink-0 flex flex-col text-gray-800 dark:text-gray-300 overflow-hidden border-r border-gray-200 dark:border-gray-700/60 h-screen ${
        isSidebarOpen 
          ? 'w-64 lg:w-64 max-sm:w-full max-sm:fixed max-sm:inset-0 max-sm:z-50' 
          : 'w-0 lg:w-0 max-sm:w-0'
      }`} style={{ zIndex: 40 }}>
        <div className="w-64 lg:w-64 max-sm:w-full h-full flex flex-col p-2">
            {/* Top Section */}
            <div className="flex items-center gap-2 mb-4">
              <button onClick={requestNewChat} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                <Orbit className="h-6 w-6" />
              </button>
              <div className="flex-1 text-lg font-semibold text-gray-900 dark:text-white">{t('Project')}</div>
              <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-600/50">
                  <ChevronLeft className="h-5 w-5 text-aliceblue" />
              </button>
            </div>



            {/* Scrollable Area */}
            <div className="flex-1 overflow-y-auto min-h-0">
                <div className="flex flex-col gap-2 mb-4">


                    <Link to="/audio" className={`flex items-center gap-3 px-3 py-2 rounded-full text-sm font-medium ${location.pathname.startsWith('/audio') ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-dark' : 'hover:bg-gray-200/50 dark:hover:bg-gray-200/50'}`}>
                        <FaBookOpen className="h-5 w-5 text-aliceblue" />
                        {t('Audio Books')}
                    </Link>

                    <Link to="/pdf-to-audio" className={`flex items-center gap-3 px-3 py-2 rounded-full text-sm font-medium ${location.pathname.startsWith('/pdf-to-audio') ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white' : 'hover:bg-gray-200/50 dark:hover:bg-gray-700/50'}`}>
                        <Headphones className="h-5 w-5 text-aliceblue" />
                        PDF to Audio
                    </Link>

                    <Link to="/library" className={`flex items-center gap-3 px-3 py-2 rounded-full text-sm font-medium ${location.pathname.startsWith('/library') ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white' : 'hover:bg-gray-200/50 dark:hover:bg-gray-700/50'}`}>
                        <Book className="h-5 w-5 text-aliceblue" />
                        Library
                    </Link>
                    <Link to="/video" className={`flex items-center gap-3 px-3 py-2 rounded-full text-sm font-medium ${location.pathname.startsWith('/video') ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white' : 'hover:bg-gray-200/50 dark:hover:bg-gray-700/50'}`}>
                        <Play className="h-5 w-5 text-aliceblue" />
                        Video
                    </Link>

                    <Link to="/notes" className={`flex items-center gap-3 px-3 py-2 rounded-full text-sm font-medium ${location.pathname.startsWith('/notes') ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white' : 'hover:bg-gray-200/50 dark:hover:bg-gray-700/50'}`}>
                        <div className="relative">
                            <FileText className="h-5 w-5 text-aliceblue" />
                            <PenTool className="h-3 w-3 text-aliceblue absolute -top-1 -right-1" />
                        </div>
                        Notes
                    </Link>

                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="flex items-center gap-3 px-3 py-2 rounded-full text-sm font-medium hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all"
                    >
                        <Upload className="h-5 w-5 text-purple-100" />
                        Load book
                    </button>
                </div>

                {/* Audio Chats Section */}
                <div className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500">
                    <FaMusic className="h-4 w-4 text-aliceblue" />
                    <span>Audio Chats</span>
                </div>
                <div className="flex flex-col gap-1 px-3 mt-2">
                    {isLoadingAudioChats ? (
                        <p className="text-center text-gray-400 dark:text-gray-500 text-sm py-2">Loading...</p>
                    ) : audioChats.length > 0 ? (
                        audioChats.map((chat) => (
                            <button
                                key={chat.id}
                                onClick={() => openAudioChat(chat.id)}
                                className={`group w-full flex items-center justify-between text-left py-1 px-3 rounded-full text-sm truncate ${chatId === chat.id ? 'text-cyan-600 dark:text-cyan-400 bg-gray-200 dark:bg-gray-700' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                                title={chat.name}
                            >
                                <span className="flex-1 truncate">{chat.name}</span>
                                <span onClick={(e) => {e.stopPropagation(); handleDeleteChat(chat.id, 'audio')}} className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600">
                                    <MoreHorizontal className="w-4 h-4" />
                                </span>
                            </button>
                        ))
                    ) : (
                        <p className="text-center text-gray-400 dark:text-gray-500 text-sm py-2">No audio chats yet</p>
                    )}
                </div>

                {/* Books Section */}
                <div className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500">
                    <Book className="h-4 w-4 text-aliceblue" />
                    <span>{t('Projects')}</span>
                </div>
                <div className="flex flex-col gap-1 px-3 mt-2">
                    {currentBookChats.length > 0 ? (
                        currentBookChats.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => openBookChat(c.id)}
                                className={`group w-full flex items-center justify-between text-left py-1 px-3 rounded-full text-sm truncate ${chatId === c.id ? 'text-cyan-600 dark:text-cyan-400 bg-gray-200 dark:bg-gray-700' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                                title={c.name}
                            >
                                <span className="flex-1 truncate">{c.name}</span>
                                <span onClick={(e) => {e.stopPropagation(); handleDeleteChat(c.id, 'book')}} className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600">
                                    <MoreHorizontal className="w-4 h-4" />
                                </span>
                            </button>
                        ))
                    ) : (
                        <p className="text-center text-gray-400 dark:text-gray-500 text-sm py-2">No books yet</p>
                    )}
                </div>

                {/* History Section */}

            </div>

            {/* Footer/Profile Section */}
            <div className="mt-auto border-t border-gray-200 dark:border-gray-700/60 pt-2">
                <div className="flex items-center p-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50">
                    <div className="flex items-center gap-3 flex-1">
                        {profileLoading ? ( // Если профиль загружается
                            <>
                                <div className="w-9 h-9 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse"></div> {/* Скелетон для аватара */}
                                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20 animate-pulse"></div> {/* Скелетон для имени */}
                            </>
                        ) : userInfo ? ( // Если профиль загружен
                            <>
                                <div onClick={() => navigate('/profile')} className="w-9 h-9 rounded-full bg-pink-500 flex items-center justify-center font-bold text-white text-lg cursor-pointer">
                                    {userInfo?.username.charAt(0).toUpperCase()} {/* Первая буква имени */}
                                </div>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">{userInfo?.username}</span> {/* Имя пользователя */}
                            </>
                        ) : ( // Если профиль не загружен (например, ошибка или не вошел)
                            <>
                                <div onClick={() => navigate('/profile')} className="w-9 h-9 rounded-full bg-gray-400 flex items-center justify-center font-bold text-white text-lg cursor-pointer">
                                    <User className="w-5 h-5" /> {/* Иконка User */}
                                </div>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">{t('User')}</span> {/* Запасной текст "User" */}
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <LanguageSwitcher />
                        
                        <button onClick={handleLogout} className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-600/50" title={t('Logout')}>
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </aside>

      {/* Main Content (Outlet for child routes) */}
      <main className="flex-1 flex flex-col relative min-w-0 overflow-hidden">
        <div className="p-2 absolute top-0 left-0 z-30">
          {!isSidebarOpen && (
            <button onClick={() => setIsSidebarOpen(true)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Open sidebar">
                <svg className="w-6 h-6 text-aliceblue" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
      <CreateBookChatModal
  isOpen={isUploadModalOpen}
  onClose={() => setIsUploadModalOpen(false)}
  onBookChatCreated={(bookChatId) => navigate(`/book-chat/${bookChatId}`)}
/>
    </div>
  );
};

export default SidebarLayout; 