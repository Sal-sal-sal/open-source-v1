import { authFetch } from './auth';
import { trackNoteCreated, trackError } from './analytics';
import type { StructuredNote, NoteWithChatInfo, ChatMessage } from '../types/notes';

export const createNote = async (chatId: string, sourceText: string): Promise<StructuredNote> => {
  try {
    // Add AI processing instructions to improve note quality
    const enhancedSourceText = `${sourceText}\n\nИнструкции для ИИ:\nСоздай структурированную заметку с глубоким анализом, включающую:\n- Ключевые идеи и концепции\n- Личные ассоциации и связи с опытом\n- Практическое применение в реальной жизни\n- Важность для личного развития\n- Конкретные шаги для реализации\n\nБудь креативным и дай уникальные инсайты, а не шаблонные ответы.`;
    
    const response = await authFetch('/api/notes/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        source_text: enhancedSourceText,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create note');
    }

    // Track structured note creation
    trackNoteCreated('ai_generated');
    
    return response.json();
  } catch (error) {
    trackError('structured_note_creation_failed', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
};

export const getAllNotes = async (): Promise<NoteWithChatInfo[]> => {
  const response = await authFetch('/api/notes/', {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch notes');
  }

  return response.json();
};

export const getChatHistory = async (chatId: string, chatType: 'chat' | 'book_chat' | 'audio_chat', currentTime?: number): Promise<string> => {
  try {
    let endpoint: string;
    let params: URLSearchParams | null = null;
    
    switch (chatType) {
      case 'chat':
        endpoint = `/api/chat/${chatId}/messages`;
        break;
      case 'book_chat':
        endpoint = `/api/book_chat/${chatId}/messages`;
        break;
      case 'audio_chat':
        endpoint = `/api/audio-chats/${chatId}/messages`;
        if (currentTime !== undefined) {
          params = new URLSearchParams();
          params.append('current_time', currentTime.toString());
        }
        break;
      default:
        throw new Error('Invalid chat type');
    }

    // Add query parameters if they exist
    if (params) {
      endpoint += `?${params.toString()}`;
    }

    const response = await authFetch(endpoint, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch chat history');
    }

    const messages: ChatMessage[] = await response.json();
    
    // Combine all messages into a structured text for better AI processing
    const chatHistory = messages
      .map((msg, index) => {
        const role = msg.role === 'user' ? 'Пользователь' : 'Ассистент';
        return `[${index + 1}] ${role}: ${msg.content}`;
      })
      .join('\n\n');
    
    // Add context for AI processing
    const structuredHistory = `Контекст чата:\n${chatHistory}\n\nПожалуйста, создай структурированную заметку на основе этого диалога, включая:\n- Основные идеи и концепции\n- Личные ассоциации и связи\n- Практическое применение\n- Важность для обучения`;
    
    return structuredHistory;
  } catch (error) {
    trackError('chat_history_fetch_failed', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
};

export const createNotesFromChatHistory = async (chatId: string, chatType: 'chat' | 'book_chat' | 'audio_chat', currentTime?: number): Promise<StructuredNote> => {
  try {
    // Get chat history
    const chatHistory = await getChatHistory(chatId, chatType, currentTime);
    
    // Create note from chat history
    const note = await createNote(chatId, chatHistory);
    
    return note;
  } catch (error) {
    trackError('notes_from_chat_history_failed', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
};

export const updateNote = async (noteId: number, implementationPlan: string): Promise<StructuredNote> => {
  try {
    const response = await authFetch(`/api/notes/${noteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        implementation_plan: implementationPlan,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update note');
    }

    return response.json();
  } catch (error) {
    trackError('note_update_failed', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
};

export const deleteNote = async (noteId: number): Promise<void> => {
  try {
    const response = await authFetch(`/api/notes/${noteId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete note');
    }

    // Track note deletion
    trackError('note_deleted', 'Note deleted successfully');
  } catch (error) {
    trackError('note_deletion_failed', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
};

export const getNote = async (noteId: number): Promise<StructuredNote> => {
  try {
    const response = await authFetch(`/api/notes/${noteId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch note');
    }

    return response.json();
  } catch (error) {
    trackError('note_fetch_failed', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}; 