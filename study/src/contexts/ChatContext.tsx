import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { getBookChats, getChats, createChat as apiCreateChat } from '../utils/chat';
import { useNavigate } from 'react-router-dom';

interface ChatSummary {
  id: string;
  name: string;
}

interface ChatContextType {
  bookChats: ChatSummary[];
  historyChats: ChatSummary[];
  loadChats: () => Promise<void>;
  createChat: (message: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bookChats, setBookChats] = useState<ChatSummary[]>([]);
  const [historyChats, setHistoryChats] = useState<ChatSummary[]>([]);
  const navigate = useNavigate();

  const loadChats = useCallback(async () => {
    try {
      const bookData = await getBookChats();
      setBookChats(bookData.map((c: any) => ({ id: c.id, name: c.name || `Book - ${c.id.slice(0, 8)}` })));
      
      const histData = await getChats();
      setHistoryChats(histData.map((c: any) => ({ id: c.id, name: c.name || `Chat - ${c.id.slice(0, 8)}` })));
    } catch (error) {
      console.error("Failed to load chats:", error);
      // Optional: handle auth errors by redirecting to login
    }
  }, []);

  const createChat = useCallback(async (message: string) => {
    try {
      const newChatId = await apiCreateChat();
      if (newChatId) {
        // Store the initial message to be sent after navigation
        sessionStorage.setItem('pendingMessage', message);
        await loadChats(); // Reload the chat list to include the new empty chat
        navigate(`/chat?chat_id=${newChatId}`);
      }
    } catch (error) {
      console.error("Failed to create chat:", error);
    }
  }, [loadChats, navigate]);

  const value = {
    bookChats,
    historyChats,
    loadChats,
    createChat,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}; 