import { authFetch } from './auth';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export type Note = {
  id: number;
  content: string;
  chat_id: string;
  created_at: string;
  updated_at: string;
};

export const getNotes = async (chatId: string): Promise<Note[]> => {
  const response = await authFetch(`${API_BASE}/api/chats/${chatId}/notes`);
  if (!response.ok) {
    throw new Error('Failed to fetch notes');
  }
  return response.json();
};

export const createNote = async (chatId: string, content: string): Promise<Note> => {
  const response = await authFetch(`${API_BASE}/api/chats/${chatId}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  });
  if (!response.ok) {
    throw new Error('Failed to create note');
  }
  return response.json();
};

export const updateNote = async (noteId: number, content: string): Promise<Note> => {
  const response = await authFetch(`${API_BASE}/api/notes/${noteId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  });
  if (!response.ok) {
    throw new Error('Failed to update note');
  }
  return response.json();
};

export const deleteNote = async (noteId: number): Promise<void> => {
  const response = await authFetch(`${API_BASE}/api/notes/${noteId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete note');
  }
}; 