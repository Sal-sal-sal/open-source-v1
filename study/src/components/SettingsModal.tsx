import React from 'react';
import { X } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-sm relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white">
          <X size={24} />
        </button>
        <h2 className="text-xl font-semibold text-white mb-4">Settings</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Language</label>
            <LanguageSwitcher />
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Theme</label>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}; 