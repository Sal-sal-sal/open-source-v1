import { authFetch } from '../../utils/auth';
import { trackNoteCreated, trackError } from '../../utils/analytics';

export interface StructuredNote {
  title: string;
  meaning: string;
  association: string;
  personal_relevance: string;
  importance: string;
  implementation_plan: string | null;
}

export interface NoteWithChatInfo {
  id: number;
  title: string;
  meaning: string;
  association: string;
  personal_relevance: string;
  importance: string;
  implementation_plan: string | null;
  created_at: string;
  chat_name: string | null;
  chat_type: string | null;
}

export const createNote = async (chatId: string, sourceText: string): Promise<StructuredNote> => {
  try {
    const response = await authFetch('/api/notes/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        source_text: sourceText,
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
