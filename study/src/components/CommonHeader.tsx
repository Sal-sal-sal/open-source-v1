import React from 'react';
import { Brain } from 'lucide-react';

interface CommonHeaderProps {
  currentPage?: 'landing' | 'pricing';
}

const CommonHeader: React.FC<CommonHeaderProps> = ({ currentPage = 'landing' }) => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-sm border-b border-gray-800/50">
      <div className="container mx-auto flex justify-between items-center p-4">
        <a href="/" className="text-2xl font-bold text-purple-400 flex items-center space-x-2">
          <Brain className="h-8 w-8" />
          <span>LearnTug</span>
        </a>
        <nav className="hidden md:flex items-center space-x-6">
          <a href="/" className={`transition-colors ${currentPage === 'landing' ? 'text-purple-400' : 'hover:text-purple-400'}`}>
            Главная
          </a>
          <a href="/chat" className="hover:text-purple-400 transition-colors">Чат</a>
          <a href="/library" className="hover:text-purple-400 transition-colors">Библиотека</a>
          <a href="/pricing" className={`transition-colors ${currentPage === 'pricing' ? 'text-purple-400' : 'hover:text-purple-400'}`}>
            Тарифы
          </a>
          <a href="#features" className="hover:text-purple-400 transition-colors">Возможности</a>
          <a href="#faq" className="hover:text-purple-400 transition-colors">FAQ</a>
        </nav>
        <div className="flex items-center space-x-4">
          <a href="/login" className="hover:text-purple-400 transition-colors">Войти</a>
          <a href="/register" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
            Начать
          </a>
        </div>
      </div>
    </header>
  );
};

export default CommonHeader; 