import React from 'react';
import NotesList from '../components/NotesList';

const NotesPage: React.FC = () => {
  return (
    <div className="relative min-h-screen p-6 overflow-hidden">
      {/* Видео фон Notes */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{ filter: 'brightness(0.3)' }}
      >
        <source src="/resurses/notes.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Затемнение поверх видео */}
      <div className="absolute inset-0 bg-black/40 z-10"></div>
      
      {/* Контент */}
      <div className="relative z-20 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">My Notes</h1>
          <p className="text-white/80">
            View and manage your structured notes created from chat conversations.
          </p>
        </div>
        
        <NotesList />
      </div>
    </div>
  );
};

export default NotesPage; 