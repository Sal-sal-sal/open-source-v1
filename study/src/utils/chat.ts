import { authFetch } from './auth';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const createBookChat = async (fileId: string, name?: string) => {
  const res = await authFetch(`${API_BASE}/api/book-chats`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_id: fileId, name }),
  });
  if (!res.ok) {
    throw new Error('Could not create a new chat for the document.');
  }
  const data = await res.json();
  return data;
};

export const getBookChats = async () => {
    const res = await authFetch(`${API_BASE}/api/book-chats`);
    if (!res.ok) {
        throw new Error('Server returned ' + res.status);
    }
    return res.json();
}

export const deleteBookChat = async (chatId: string) => {
    const res = await authFetch(`${API_BASE}/api/book-chats/${chatId}`, {
        method: 'DELETE',
    });
    if (!res.ok) {
        throw new Error('Could not delete the book chat.');
    }
    return true;
};

export const deleteChat = async (chatId: string) => {
    const res = await authFetch(`${API_BASE}/api/chat/${chatId}`, {
        method: 'DELETE',
    });
    if (!res.ok) {
        throw new Error('Could not delete the chat.');
    }
    return true;
};

export const renameChat = async (chatId: string, newName: string) => {
    const res = await authFetch(`${API_BASE}/api/chat/${chatId}/put`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
    });
    if (!res.ok) {
        throw new Error('Server returned ' + res.status);
    }
    return res.json();
}

export const createChat = async () => {
    const res = await authFetch(`${API_BASE}/api/chat/new`, { method: 'POST' });
    if (!res.ok) {
        throw new Error('Could not create a new chat.');
    }
    const data = await res.json();
    return data.chat_id;
};

// Simple chat list
export const getChats = async () => {
    const res = await authFetch(`${API_BASE}/api/chat`);
    if (!res.ok) {
        throw new Error('Server returned ' + res.status);
    }
    return res.json();
}