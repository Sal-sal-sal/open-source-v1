import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { authFetch, clearToken } from '../utils/auth';
import { Orbit, Search, FileEdit, CheckSquare, Book, History, ChevronLeft, MoreHorizontal, LogOut } from 'lucide-react';
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

interface ChatSummary {
  id: string;
  name: string;
}

interface BookChat {
    id: string;
    name?: string;
}

interface SearchResult {
  id: string;
  name: string;
  type: "chat" | "book_chat";
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Mock user data for the profile section
const mockUser = {
  username: 'Saladin',
  avatarInitial: 'S',
};

const SidebarLayout: React.FC = () => {
  const { t } = useTranslation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const chatId = searchParams.get('chat_id') || location.pathname.split('/').pop();

  const { bookChats, historyChats, loadChats } = useChat();
  const [currentBookChats, setCurrentBookChats] = useState(bookChats);
  const [currentHistoryChats, setCurrentHistoryChats] = useState(historyChats);

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

  const requestNewChat = () => {
    navigate("/documents");
  };

  const handleDeleteChat = async (id: string, type: 'book' | 'history') => {
    if (
      !window.confirm(`Are you sure you want to delete this chat?`)
    )
      return;
    try {
      if (type === 'book') {
        await deleteBookChat(id);
      } else {
        await deleteChat(id);
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

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-[#1C1C1C] text-gray-800 dark:text-gray-300 font-sans">
      {/* Sidebar */}
      <aside className={`bg-gray-50 dark:bg-[#1C1C1C] transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-0'} flex-shrink-0 flex flex-col text-gray-800 dark:text-gray-300 overflow-hidden border-r border-gray-200 dark:border-gray-700/60`}>
        <div className="w-64 h-full flex flex-col p-2">
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

            {/* Search and Main Nav */}
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
                <input 
                  type="text" 
                  placeholder={t('Search') + '...'} 
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearch}
                />
            </div>

            {/* Scrollable Area */}
            <div className="flex-1 overflow-y-auto min-h-0">
                <div className="flex flex-col gap-2 mb-4">
                    <a href="/chat" className={`flex items-center gap-3 px-3 py-2 rounded-full text-sm font-medium ${location.pathname.startsWith('/chat') ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white' : 'hover:bg-gray-200/50 dark:hover:bg-gray-700/50'}`}>
                        <FileEdit className="h-5 w-5 text-aliceblue" />
                        {t('Chat')}
                    </a>
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
                <div className="mt-4 flex items-center gap-3 px-3 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500">
                    <History className="h-4 w-4 text-aliceblue" />
                    <span>{t('History')}</span>
                </div>
                <div className="flex flex-col gap-1 px-3 mt-2">
                    {currentHistoryChats.length > 0 ? (
                        currentHistoryChats.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => openNormalChat(c.id)}
                                className={`group w-full flex items-center justify-between text-left py-1 px-3 rounded-full text-sm truncate ${chatId === c.id ? 'text-cyan-600 dark:text-cyan-400 bg-gray-200 dark:bg-gray-700' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                                title={c.name}
                            >
                                <span className="flex-1 truncate">{c.name}</span>
                                <span onClick={(e) => {e.stopPropagation(); handleDeleteChat(c.id, 'history')}} className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600">
                                    <MoreHorizontal className="w-4 h-4" />
                                </span>
                            </button>
                        ))
                    ) : (
                        <p className="text-center text-gray-400 dark:text-gray-500 text-sm py-4">No chats yet</p>
                    )}
                </div>
            </div>

            {/* Footer/Profile Section */}
            <div className="mt-auto border-t border-gray-200 dark:border-gray-700/60 pt-2">
                <div className="flex items-center p-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="w-9 h-9 rounded-full bg-pink-500 flex items-center justify-center font-bold text-white text-lg">
                            {mockUser.avatarInitial}
                        </div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{mockUser.username}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <LanguageSwitcher />
                        <ThemeToggle />
                        <button onClick={handleLogout} className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-600/50" title={t('Logout')}>
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </aside>

      {/* Main Content (Outlet for child routes) */}
      <main className="flex-1 flex flex-col relative min-w-0">
        <div className="p-2 absolute top-0 left-0 z-10">
          {!isSidebarOpen && (
            <button onClick={() => setIsSidebarOpen(true)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Open sidebar">
                <svg className="w-6 h-6 text-aliceblue" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
            </button>
          )}
        </div>
        <Outlet />
      </main>
    </div>
  );
};

export default SidebarLayout; 