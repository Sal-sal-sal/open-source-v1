import React, { useState, useEffect } from 'react';
import { createNote, getAllNotes, type StructuredNote, type NoteWithChatInfo } from '../components/notes/Create_notes';

const NotesPage: React.FC = () => {
  const [chatId, setChatId] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [note, setNote] = useState<StructuredNote | null>(null);
  const [notes, setNotes] = useState<NoteWithChatInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const allNotes = await getAllNotes();
        setNotes(allNotes);
      } catch (err) {
        setError('Failed to load notes.');
        console.error(err);
      } finally {
        setIsLoadingNotes(false);
      }
    };

    fetchNotes();
  }, []);

  const handleCreateNote = async () => {
    if (!chatId || !sourceText) {
      setError('Chat ID and source text are required.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const createdNote = await createNote(chatId, sourceText);
      setNote(createdNote);
      // Refresh the notes list
      const allNotes = await getAllNotes();
      setNotes(allNotes);
    } catch (err) {
      setError('An error occurred while creating the note.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">Notes</h2>
      
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Display All Notes */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">All Notes</h3>
        
        {isLoadingNotes ? (
          <div className="text-center py-8">Loading notes...</div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No notes found.</div>
        ) : (
          <div className="space-y-6">
            {notes.map((note) => (
              <div key={note.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                {/* Chat Name Header */}
                <div className="mb-3">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {note.chat_name || 'Unnamed Chat'}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(note.created_at)}
                  </p>
                </div>
                
                {/* Note Content */}
                <div className="space-y-2">
                  <h5 className="text-md font-medium">{note.title}</h5>
                  <p><strong>Meaning:</strong> {note.meaning}</p>
                  <p><strong>Association:</strong> {note.association}</p>
                  <p><strong>Personal Relevance:</strong> {note.personal_relevance}</p>
                  <p><strong>Importance:</strong> {note.importance}</p>
                  {note.implementation_plan && (
                    <p><strong>Implementation Plan:</strong> {note.implementation_plan}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesPage; 