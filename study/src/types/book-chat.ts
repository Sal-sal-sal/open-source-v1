export interface BookChatMessage {
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface BookChatResponse {
  messages: BookChatMessage[];
  file_id: string;
} 