export interface FileUploadResponse {
  file_id: string;
  filename: string;
  size_bytes: number;
  upload_time: string;
  status: string;
  chunks_count: number;
  book_chat_id?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatRequest {
  message: string;
  file_id: string;
  context_window?: number;
}

export interface ChatResponse {
  answer: string;
  sources: string[];
  confidence: number;
}

export interface DocumentInfo {
  file_id: string;
  filename: string;
  upload_time: string;
  total_chunks: number;
  file_type: string;
} 