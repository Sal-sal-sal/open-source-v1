import { useNavigate } from 'react-router-dom';
import { FileUploadForm } from '../components/FileUploadForm';
import type { FileUploadResponse } from '../types';
import { BookOpen } from 'lucide-react';

export const FileUpload = () => {
  const navigate = useNavigate();

  const handleUploadSuccess = (response: FileUploadResponse) => {
    // Navigate to chat page with file info
    navigate('/chat', { 
      state: { 
        fileId: response.file_id,
        filename: response.filename 
      } 
    });
  };

  return (
    <div className="min-h-screen bg-[#1b1b1b] text-gray-300 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <BookOpen className="w-16 h-16 text-cyan-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            AI Учитель
          </h1>
          <p className="text-lg text-gray-400">
            Загрузите учебник и задавайте вопросы по его содержанию
          </p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4 text-center">
            Загрузите учебный материал
          </h2>
          
          <FileUploadForm onUploadSuccess={handleUploadSuccess} />
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>После загрузки файла вы сможете:</p>
            <ul className="mt-2 space-y-1 text-gray-400">
              <li>• Задавать вопросы по содержанию</li>
              <li>• Получать объяснения сложных концепций</li>
              <li>• Просить пояснить конкретные параграфы</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}; 