import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="relative">
      <Languages className="w-5 h-5 text-gray-400" />
      <select 
        onChange={(e) => changeLanguage(e.target.value)} 
        value={i18n.language}
        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
      >
        <option value="en">English</option>
        <option value="ru">Русский</option>
      </select>
    </div>
  );
}; 