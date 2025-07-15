import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
import type { FileUploadResponse } from '../types';

interface FileUploadFormProps {
  onUploadSuccess: (response: FileUploadResponse) => void;
}

export const FileUploadForm: React.FC<FileUploadFormProps> = ({ onUploadSuccess }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setError(null);
    setIsUploading(true);

    try {
      const response = await api.uploadFile(file);
      onUploadSuccess(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при загрузке файла');
    } finally {
      setIsUploading(false);
    }
  }, [onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  return (
    <div className="w-full max-w-xl mx-auto p-6">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
          transition-all duration-300 ease-in-out
          bg-slate-800/50 backdrop-blur-sm border-slate-700
          hover:border-cyan-400 hover:bg-slate-700/60
          ${isDragActive ? 'border-cyan-500 bg-slate-700/70 scale-105' : ''}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-4">
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
              <p className="text-slate-300">Загрузка и обработка файла...</p>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-slate-400 mb-2" />
              <div>
                <p className="text-lg font-medium text-slate-100">
                  {isDragActive ? 'Отпустите файл здесь' : 'Перетащите файл сюда'}
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  или нажмите для выбора файла
                </p>
              </div>
              <div className="flex items-center space-x-2 text-sm text-slate-400 pt-4">
                <FileText className="w-4 h-4" />
                <span>Поддерживаются PDF и TXT файлы до 10 МБ</span>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-900/50 border border-red-500/50 rounded-lg flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}; 