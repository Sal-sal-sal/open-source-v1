import axios from 'axios';
import type { FileUploadResponse, ChatRequest, ChatResponse, DocumentInfo } from '../types';
import { getToken } from '../utils/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://74.249.178.56:8000';

const apiClient = axios.create({
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
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post<FileUploadResponse>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },
  
  // Send a chat message
  sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
    const response = await apiClient.post<ChatResponse>('/api/chat', request);
    return response.data;
  },
  
  // Get list of documents
  getDocuments: async (): Promise<DocumentInfo[]> => {
    const response = await apiClient.get<{ documents: DocumentInfo[] }>('/api/documents');
    return response.data.documents;
  },
}; 
