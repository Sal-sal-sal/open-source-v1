import axios from 'axios';
import type { FileUploadResponse, ChatRequest, ChatResponse, DocumentInfo } from '../types';
import { getToken } from '../utils/auth';
import { trackFileUpload, trackDocumentProcessed, trackError } from '../utils/analytics';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://74.249.178.56:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the token
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const api = {
  // Upload a file
  uploadFile: async (file: File): Promise<FileUploadResponse> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiClient.post<FileUploadResponse>('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Track file upload
      trackFileUpload(file.type, file.size);
      
      return response.data;
    } catch (error) {
      trackError('file_upload_failed', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  },
  
  // Send a chat message
  sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
    try {
      const response = await apiClient.post<ChatResponse>('/api/chat', request);
      
      // Track chat message
      trackDocumentProcessed('chat_message');
      
      return response.data;
    } catch (error) {
      trackError('chat_message_failed', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  },

  // Send a general chat message (for AudioPage)
  sendGeneralMessage: async (message: string): Promise<{ answer: string }> => {
    try {
      const response = await apiClient.post('/api/chat/general', { message });
      
      // Track chat message
      trackDocumentProcessed('general_chat_message');
      
      return response.data;
    } catch (error) {
      trackError('general_chat_message_failed', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  },
  
  // Get list of documents
  getDocuments: async (): Promise<DocumentInfo[]> => {
    try {
      const response = await apiClient.get<{ documents: DocumentInfo[] }>('/api/documents');
      return response.data.documents;
    } catch (error) {
      trackError('get_documents_failed', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  },

  // Project Gutenberg API methods
  searchGutenbergBooks: async (params: {
    q?: string;
    author?: string;
    title?: string;
    language?: string;
    subject?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    books: any[];
    count: number;
    total: number;
    next?: string;
    previous?: string;
  }> => {
    try {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.append(key, value.toString());
        }
      });
      
      const response = await apiClient.get(`/api/gutenberg/search?${searchParams}`);
      return response.data;
    } catch (error) {
      trackError('gutenberg_search_failed', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  },

  getGutenbergBook: async (bookId: number): Promise<any> => {
    try {
      const response = await apiClient.get(`/api/gutenberg/book/${bookId}`);
      return response.data;
    } catch (error) {
      trackError('gutenberg_book_failed', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  },

  getGutenbergBookText: async (bookId: number): Promise<{
    book_id: number;
    text: string;
    html_text: string;
    length: number;
    source: string;
  }> => {
    try {
      const response = await apiClient.get(`/api/gutenberg/text/${bookId}`);
      return response.data;
    } catch (error) {
      trackError('gutenberg_text_failed', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  },

  getPopularGutenbergBooks: async (limit: number = 10): Promise<any[]> => {
    try {
      const response = await apiClient.get(`/api/gutenberg/popular?limit=${limit}`);
      return response.data;
    } catch (error) {
      trackError('gutenberg_popular_failed', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  },

  getGutenbergCategories: async (): Promise<{ categories: string[] }> => {
    try {
      const response = await apiClient.get('/api/gutenberg/categories');
      return response.data;
    } catch (error) {
      trackError('gutenberg_categories_failed', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  },

  convertGutenbergBookToAudio: async (bookId: number): Promise<{
    book_id: number;
    title: string;
    authors: string[];
    audio_url?: string;
    duration?: number;
    file_size?: number;
    text_length: number;
    status: string;
  }> => {
    try {
      const response = await apiClient.post(`/api/gutenberg/convert-to-audio/${bookId}`);
      return response.data;
    } catch (error) {
      trackError('gutenberg_convert_to_audio_failed', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  },
}; 

export const updateStudyTime = async (minutes: number) => {
  const response = await apiClient.post('/api/profile/study-time', { minutes });
  return response.data;
}

export const getUserProfile = async () => {
  const response = await apiClient.get('/api/profile');
  return response.data;
}
