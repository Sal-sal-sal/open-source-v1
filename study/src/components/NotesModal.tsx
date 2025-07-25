import React, { useState, useEffect, useCallback } from 'react';
import { getAllNotes, createNote, updateNote, deleteNote } from '../utils/notes';
import type { NoteWithChatInfo } from '../types/notes';
import { X, Edit, Trash2, Plus } from 'lucide-react';

interface NotesModalProps {
  chatId: string;
  isOpen: boolean;
  onClose: () => void;
}

const NotesModal: React.FC<NotesModalProps> = ({ chatId, isOpen, onClose }) => {
  const [notes, setNotes] = useState<NoteWithChatInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNote, setEditingNote] = useState<NoteWithChatInfo | null>(null);
  const [editingContent, setEditingContent] = useState('');

  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedNotes = await getAllNotes();
      // Filter notes for this specific chat (we'll need to check chat_type and chat_name)
      const chatNotes = fetchedNotes.filter(note => 
        note.chat_type && note.chat_name && note.chat_name.includes(chatId)
      );
      setNotes(chatNotes);
    } catch (err) {
      setError('Failed to load notes.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    if (isOpen) {
      fetchNotes();
    }
  }, [isOpen, fetchNotes]);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;

    try {
      await createNote(chatId, newNoteContent);
      setNewNoteContent('');
      fetchNotes(); // Refresh list
    } catch (err) {
      setError('Failed to create note.');
      console.error(err);
    }
  };

  const handleUpdateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote || !editingContent.trim()) return;

    try {
      await updateNote(editingNote.id, editingContent);
      setEditingNote(null);
      setEditingContent('');
      fetchNotes(); // Refresh list
    } catch (err) {
      setError('Failed to update note.');
      console.error(err);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      await deleteNote(noteId);
      fetchNotes(); // Refresh list
    } catch (err) {
      setError('Failed to delete note.');
      console.error(err);
    }
  };

  const startEditing = (note: NoteWithChatInfo) => {
    setEditingNote(note);
    setEditingContent(note.meaning); // Use meaning as the editable content
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl p-6 relative max-h-[80vh] flex flex-col">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Notes</h2>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
          <X size={24} />
        </button>

        {/* Edit Form */}
        {editingNote ? (
          <form onSubmit={handleUpdateNote} className="mb-4">
            <textarea
              className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
              value={editingContent}
              onChange={(e) => setEditingContent(e.target.value)}
              rows={3}
              required
            />
            <div className="flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setEditingNote(null)} className="px-4 py-2 rounded text-gray-600 dark:text-gray-300">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600">Save</button>
            </div>
          </form>
        ) : (
          /* Create Form */
          <form onSubmit={handleCreateNote} className="mb-6">
            <textarea
              className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Add a new note..."
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              rows={3}
              required
            />
            <div className="flex justify-end mt-2">
              <button type="submit" className="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600 flex items-center gap-2">
                <Plus size={18} /> Add Note
              </button>
            </div>
          </form>
        )}

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {/* Notes List */}
        <div className="overflow-y-auto">
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <ul className="space-y-4">
              {notes.map((note) => (
                <li key={note.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg flex justify-between items-start">
                  <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{note.meaning}</p>
                  <div className="flex gap-2 ml-4">
                    <button onClick={() => startEditing(note)} className="text-blue-500 hover:text-blue-700"><Edit size={18} /></button>
                    <button onClick={() => handleDeleteNote(note.id)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotesModal; 