import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import AppRoutes from './routes';
import { NotesProvider } from './contexts/NotesContext';
import { ChatProvider } from './contexts/ChatContext';
import { useIdle } from './hooks/useIdle';
import Starfield from './components/Starfield';
import { Toaster } from './components/Toaster';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import PWAUpdatePrompt from './components/PWAUpdatePrompt';
import { trackEngagement, trackPageView } from './utils/analytics';

const App: React.FC = () => {
    const isIdle = useIdle();
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    useEffect(() => {
        // Track app initialization
        trackPageView('app_initialized');
        
        // Track session start
        trackEngagement('session_start');
        
        // Track when user becomes idle
        if (isIdle) {
            trackEngagement('user_idle');
        }
    }, [isIdle]);

    // Check if Google OAuth is configured
    if (!googleClientId) {
        console.warn('Google OAuth not configured. Set VITE_GOOGLE_CLIENT_ID in your .env file to enable Google sign-in.');
    }

    return (
        <GoogleOAuthProvider clientId={googleClientId || 'dummy-client-id'}>
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
                            <PWAInstallPrompt />
                            <PWAUpdatePrompt />
                        </div>
                    </NotesProvider>
                </ChatProvider>
            </BrowserRouter>
        </GoogleOAuthProvider>
    );
};

export default App; 