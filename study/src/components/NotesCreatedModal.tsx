import React, { useState, useEffect } from 'react';
import { X, Edit, Save, CheckCircle } from 'lucide-react';

interface CreatedNote {
  id?: number;
  title: string;
  meaning: string;
  association: string;
  personal_relevance: string;
  importance: string;
  implementation_plan: string;
  user_question?: string;
  created_at?: string;
}

interface NotesCreatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  createdNote: CreatedNote | null;
  onNoteUpdate?: (updatedNote: CreatedNote) => void;
}

const NotesCreatedModal: React.FC<NotesCreatedModalProps> = ({ 
  isOpen, 
  onClose, 
  createdNote, 
  onNoteUpdate 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedNote, setEditedNote] = useState<CreatedNote | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
  }, [isOpen]);

  if (!isOpen || !createdNote) return null;

  const handleEditStart = () => {
    setIsEditing(true);
    setEditedNote({ ...createdNote });
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditedNote(null);
  };

  const handleSave = () => {
    if (editedNote && onNoteUpdate) {
      onNoteUpdate(editedNote);
    }
    setIsEditing(false);
    setEditedNote(null);
  };

  const handleFieldChange = (field: keyof CreatedNote, value: string) => {
    if (editedNote) {
      setEditedNote({ ...editedNote, [field]: value });
    }
  };

  const displayNote = isEditing ? editedNote : createdNote;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Background with strong blur effect */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md"></div>
      
             {/* Modal Content with animation */}
       <div 
         className={`relative z-10 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto`}
         style={{
           animation: isAnimating ? 'modalBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
         }}
       >
         <style>{`
           @keyframes modalBounce {
             0% {
               transform: translateY(100vh);
               opacity: 0;
             }
             70% {
               transform: translateY(-20px);
               opacity: 0.9;
             }
             85% {
               transform: translateY(10px);
               opacity: 0.95;
             }
             100% {
               transform: translateY(0);
               opacity: 1;
             }
           }
         `}</style>
        <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-lg shadow-2xl p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-400 h-8 w-8" />
              <h2 className="text-2xl font-bold text-white">
                Заметка создана!
              </h2>
            </div>
            
            <div className="flex items-center gap-2">
              {!isEditing && (
                <button
                  onClick={handleEditStart}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Редактировать заметку"
                >
                  <Edit className="h-5 w-5" />
                </button>
              )}
              
              <button
                onClick={onClose}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Закрыть"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Note Content */}
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                📝 Заголовок
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={displayNote?.title || ''}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              ) : (
                <div className="p-4 bg-white/5 border border-white/10 rounded-lg text-white">
                  {displayNote?.title}
                </div>
              )}
            </div>

            {/* Meaning */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                💡 Основное содержание
              </label>
              {isEditing ? (
                <textarea
                  value={displayNote?.meaning || ''}
                  onChange={(e) => handleFieldChange('meaning', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                />
              ) : (
                <div className="p-4 bg-white/5 border border-white/10 rounded-lg text-white whitespace-pre-wrap">
                  {displayNote?.meaning}
                </div>
              )}
            </div>

            {/* Association */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                🔗 Ассоциации и связи
              </label>
              {isEditing ? (
                <textarea
                  value={displayNote?.association || ''}
                  onChange={(e) => handleFieldChange('association', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                />
              ) : (
                <div className="p-4 bg-white/5 border border-white/10 rounded-lg text-white whitespace-pre-wrap">
                  {displayNote?.association}
                </div>
              )}
            </div>

            {/* Personal Relevance */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                ❤️ Личная значимость
              </label>
              {isEditing ? (
                <textarea
                  value={displayNote?.personal_relevance || ''}
                  onChange={(e) => handleFieldChange('personal_relevance', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                />
              ) : (
                <div className="p-4 bg-white/5 border border-white/10 rounded-lg text-white whitespace-pre-wrap">
                  {displayNote?.personal_relevance}
                </div>
              )}
            </div>

            {/* Importance */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                ⭐ Важность
              </label>
              {isEditing ? (
                <textarea
                  value={displayNote?.importance || ''}
                  onChange={(e) => handleFieldChange('importance', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                />
              ) : (
                <div className="p-4 bg-white/5 border border-white/10 rounded-lg text-white whitespace-pre-wrap">
                  {displayNote?.importance}
                </div>
              )}
            </div>

            {/* Implementation Plan */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                🎯 План реализации
              </label>
              {isEditing ? (
                <textarea
                  value={displayNote?.implementation_plan || ''}
                  onChange={(e) => handleFieldChange('implementation_plan', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                />
              ) : (
                <div className="p-4 bg-white/5 border border-white/10 rounded-lg text-white whitespace-pre-wrap">
                  {displayNote?.implementation_plan}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-white/20">
            {isEditing ? (
              <>
                <button
                  onClick={handleEditCancel}
                  className="px-6 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Сохранить
                </button>
              </>
            ) : (
                             <button
                 onClick={onClose}
                 className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
               >
                 <X className="h-4 w-4" />
                 Закрыть
               </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotesCreatedModal; 