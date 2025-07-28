import React, { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';

const PWAUpdatePrompt: React.FC = () => {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [updateFunction, setUpdateFunction] = useState<(() => void) | null>(null);

  useEffect(() => {
    // Listen for SW update available
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_UPDATE_AVAILABLE') {
          setShowUpdatePrompt(true);
          setUpdateFunction(() => () => {
            event.ports[0].postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
          });
        }
      });
    }

    // Check for Service Worker updates manually
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setShowUpdatePrompt(true);
                  setUpdateFunction(() => () => {
                    window.location.reload();
                  });
                }
              });
            }
          });
        }
      });
    }
  }, []);

  const handleUpdate = () => {
    if (updateFunction) {
      updateFunction();
    }
    setShowUpdatePrompt(false);
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);
  };

  if (!showUpdatePrompt) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 flex justify-center">
      <div className="backdrop-blur-sm bg-blue-600/90 border border-blue-400/20 rounded-lg shadow-2xl p-4 max-w-sm w-full">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-white" />
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="text-white font-semibold text-sm mb-1">
              Обновление доступно
            </h3>
            
            <p className="text-white/90 text-xs mb-3">
              Новая версия приложения готова к установке
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                className="flex-1 bg-white text-blue-600 text-xs px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-1 font-medium"
              >
                <RefreshCw className="w-3 h-3" />
                Обновить
              </button>
              
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 text-white/60 hover:text-white transition-colors p-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAUpdatePrompt; 