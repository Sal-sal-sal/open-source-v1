import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import { NotesProvider } from './contexts/NotesContext';
import { ChatProvider } from './contexts/ChatContext';
import { useIdle } from './hooks/useIdle';
import Starfield from './components/Starfield';
import { Toaster } from './components/Toaster';

const App: React.FC = () => {
    const isIdle = useIdle();

    return (
        <BrowserRouter>
            <ChatProvider>
                <NotesProvider>
                    <div className="min-h-screen bg-[#1b1b1b] text-white">
                        <Toaster />
                        <div 
                            className={`transition-opacity duration-1000 ${isIdle ? 'opacity-100' : 'opacity-0'}`}
                        >
                            {isIdle && <Starfield />}
                        </div>
                        <AppRoutes />
                    </div>
                </NotesProvider>
            </ChatProvider>
        </BrowserRouter>
    );
};

export default App; 