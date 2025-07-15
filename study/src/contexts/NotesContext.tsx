import React, { createContext, useState, useContext, ReactNode } from 'react';
import { api } from '../api/client'; // Assuming there's an API client

// 1. Define the type for a single note
export interface Note {
  id: number;
  header: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

// 2. Define the shape of the context data
export interface NotesContextType {
  notes: Note[];
  addNote: (header: string, text: string) => void;
  updateNote: (id: number, header: string, text: string, completed: boolean) => void;
  deleteNote: (id: number) => void;
  openNotesModal: () => void;
  closeNotesModal: () => void;
  isNotesModalOpen: boolean;
}

// 3. Create the context with a default value
export const NotesContext = createContext<NotesContextType | undefined>(undefined);

// 4. Create the provider component
export const NotesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false); // State for modal visibility

  // Function to open the notes modal
  const openNotesModal = () => {
    setIsNotesModalOpen(true);
  };

  // Function to close the notes modal
  const closeNotesModal = () => {
    setIsNotesModalOpen(false);
  };

  const addNote = (header: string, text: string) => {
    const newNote: Note = {
      id: Date.now(),
      header,
      text,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setNotes(prevNotes => [...prevNotes, newNote]);
    console.log('Note added:', newNote); // For debugging
  };

  const updateNote = (id: number, header: string, text: string, completed: boolean) => {
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === id ? { ...note, header, text, completed } : note
      )
    );
  };

  const deleteNote = (id: number) => {
    setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
  };

  return (
    <NotesContext.Provider value={{
      notes,
      addNote,
      updateNote,
      deleteNote,
      openNotesModal,
      closeNotesModal,
      isNotesModalOpen,
    }}>
      {children}
    </NotesContext.Provider>
  );
};

// 5. Create a custom hook for easy context consumption
export const useNotes = () => {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
}; 