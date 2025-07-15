import { useLocation, Navigate, Link } from 'react-router-dom';
import { ChatInterface } from '../components/ChatInterface';
import { ArrowLeft } from 'lucide-react';
import { PDFViewer } from '../components/PDFViewer';

export const Chat = () => {
  const location = useLocation();
  const state = location.state as { fileId: string; filename: string } | null;

  // Redirect to upload page if no file is selected
  if (!state || !state.fileId) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Link 
            to="/" 
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Загрузить другой файл</span>
          </Link>
        </div>
      </div>
      
      <div className="flex-1 p-4">
        <div className="max-w-7xl mx-auto h-full grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* PDF Viewer */}
          <div className="h-full overflow-y-auto">
            <PDFViewer fileUrl={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/file/${state.fileId}`} />
          </div>

          {/* Chat Interface */}
          <div className="h-full">
            <ChatInterface fileId={state.fileId} filename={state.filename} />
          </div>
        </div>
      </div>
    </div>
  );
}; 