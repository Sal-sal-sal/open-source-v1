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

export interface ChatMessage {
  role: string;
  content: string;
  created_at: string;
} 