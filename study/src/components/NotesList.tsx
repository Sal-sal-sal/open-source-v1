import React, { useState, useEffect } from 'react';
import { getAllNotes, deleteNote } from '../utils/notes';
import type { NoteWithChatInfo } from '../types/notes';
import { trackError } from '../utils/analytics';
import { Trash2 } from 'lucide-react';

interface NotesListProps {
  className?: string;
}

const NotesList: React.FC<NotesListProps> = ({ className = '' }) => {
  const [notes, setNotes] = useState<NoteWithChatInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const fetchedNotes = await getAllNotes();
      setNotes(fetchedNotes);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notes';
      setError(errorMessage);
      trackError('notes_fetch_failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!window.confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      await deleteNote(noteId);
      // Refresh the notes list
      await fetchNotes();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete note';
      setError(errorMessage);
      trackError('note_delete_failed', errorMessage);
    }
  };

  const filteredNotes = notes.filter(note => {
    if (filter === 'all') return true;
    return note.chat_type === filter;
  });

  const getChatTypeLabel = (chatType: string | null) => {
    switch (chatType) {
      case 'chat': return 'Regular Chat';
      case 'book_chat': return 'Book Chat';
      case 'audio_chat': return 'Audio Chat';
      default: return 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="backdrop-blur-sm bg-red-500/20 border border-red-300/30 rounded-md p-4">
          <p className="text-red-200">Error: {error}</p>
          <button 
            onClick={fetchNotes}
            className="mt-2 text-red-300 hover:text-red-100 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filter Controls */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-md text-sm font-medium ${
            filter === 'all' 
              ? 'bg-blue-500 text-white' 
              : 'backdrop-blur-sm bg-white/10 border border-white/20 text-white hover:bg-white/20'
          }`}
        >
          All ({notes.length})
        </button>
        <button
          onClick={() => setFilter('chat')}
          className={`px-3 py-1 rounded-md text-sm font-medium ${
            filter === 'chat' 
              ? 'bg-blue-500 text-white' 
              : 'backdrop-blur-sm bg-white/10 border border-white/20 text-white hover:bg-white/20'
          }`}
        >
          Regular Chat ({notes.filter(n => n.chat_type === 'chat').length})
        </button>
        <button
          onClick={() => setFilter('book_chat')}
          className={`px-3 py-1 rounded-md text-sm font-medium ${
            filter === 'book_chat' 
              ? 'bg-blue-500 text-white' 
              : 'backdrop-blur-sm bg-white/10 border border-white/20 text-white hover:bg-white/20'
          }`}
        >
          Book Chat ({notes.filter(n => n.chat_type === 'book_chat').length})
        </button>
        <button
          onClick={() => setFilter('audio_chat')}
          className={`px-3 py-1 rounded-md text-sm font-medium ${
            filter === 'audio_chat' 
              ? 'bg-blue-500 text-white' 
              : 'backdrop-blur-sm bg-white/10 border border-white/20 text-white hover:bg-white/20'
          }`}
        >
          Audio Chat ({notes.filter(n => n.chat_type === 'audio_chat').length})
        </button>
      </div>

      {/* Notes List */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-8 text-white/60">
          <p>No notes found.</p>
          {filter !== 'all' && (
            <button 
              onClick={() => setFilter('all')}
              className="mt-2 text-blue-400 hover:text-blue-300 underline"
            >
              View all notes
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotes.map((note) => (
            <div key={note.id} className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-lg p-4 shadow-sm hover:shadow-lg hover:bg-white/20 transition-all duration-300">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-white">{note.title}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full border border-blue-300/30">
                    {getChatTypeLabel(note.chat_type)}
                  </span>
                  <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full border border-green-300/30">
                    🤖 ИИ
                  </span>
                  <span className="text-xs text-white/60">
                    {formatDate(note.created_at)}
                  </span>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="text-red-400 hover:text-red-300 p-1 rounded-full hover:bg-red-500/20 transition-colors"
                    title="Delete note"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-white/80 mb-1">🎯 Основные идеи (Meaning)</h4>
                  <p className="text-sm text-white/70">{note.meaning}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-white/80 mb-1">🔗 Ассоциации (Association)</h4>
                  <p className="text-sm text-white/70">{note.association}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-white/80 mb-1">💡 Личная релевантность (Personal Relevance)</h4>
                  <p className="text-sm text-white/70">{note.personal_relevance}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-white/80 mb-1">⭐ Важность (Importance)</h4>
                  <p className="text-sm text-white/70">{note.importance}</p>
                </div>
                
                {note.implementation_plan && (
                  <div>
                    <h4 className="text-sm font-medium text-white/80 mb-1">📋 План реализации (Implementation Plan)</h4>
                    <p className="text-sm text-white/70">{note.implementation_plan}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotesList; 