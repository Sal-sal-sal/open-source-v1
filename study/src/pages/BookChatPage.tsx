import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { authFetch } from '../utils/auth';
import { PDFViewer } from '../components/PDFViewer';
import ReactMarkdown from 'react-markdown';
import type { BookChatResponse, BookChatMessage } from '../types/book-chat';
import { PlusCircle } from 'lucide-react';
import { useNotes } from '../contexts/NotesContext';
import PageRangeModal from '../components/PageRangeModal';
import { createBookChat } from '../utils/chat';
import type { PDFPageData } from '../types/pdf';
import { trackChatMessage, trackPageView, trackError } from '../utils/analytics';
import CreateNotesButton from '../components/CreateNotesButton';
import NotesCreatedModal from '../components/NotesCreatedModal';
import { Send, Loader, Mic, Edit3, Check, X } from 'lucide-react';
import { MessageList } from '../components/MessageList';
import { api } from '../api/client';
import { getGradient } from '../utils/gradients';

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

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ChatMessage: React.FC<{ message: BookChatMessage, onAddNote: (text: string) => void }> = ({ message, onAddNote }) => {
    const isAssistant = message.role === 'assistant';
    return (
        <div className={`py-4 `}>
            <div className={`max-w-4xl mx-auto flex px-4 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
                <div className={`group relative max-w-[70%] ${isAssistant ? '' : 'order-2'}`}>
                    <div className={`px-4 py-2 rounded-lg text-white ${isAssistant ? 'bg-[#313131]' : 'bg-[#252525]'}`}>
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                    {isAssistant && (
                        <button
                            onClick={() => onAddNote(message.content)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-cyan-400 dark:hover:text-cyan-500"
                            title="Create note from this message"
                        >
                            <PlusCircle className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const BookChatPage: React.FC = () => {
    const { chatId } = useParams<{ chatId: string }>();
    const [messages, setMessages] = useState<BookChatMessage[]>([]);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [fileId, setFileId] = useState<string | null>(null);
    const [totalPages, setTotalPages] = useState<number>(0);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isProcessingDoc, setIsProcessingDoc] = useState<boolean>(false);
    const [inputValue, setInputValue] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);
    const { addNote } = useNotes();
    const [pdfPageData, setPdfPageData] = useState<PDFPageData | null>(null);
    const [pageInputValue, setPageInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [isEditingNote, setIsEditingNote] = useState(false);
    const [noteContent, setNoteContent] = useState('');
    const [originalNote, setOriginalNote] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [audioTranscript, setAudioTranscript] = useState<string>('');
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [createdNote, setCreatedNote] = useState<CreatedNote | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        const fetchChatData = async () => {
            if (chatId) {
                try {
                    const res = await authFetch(`${API_BASE}/api/book-chats/${chatId}`);
                    if (!res.ok) throw new Error('Failed to fetch book chat');
                    const data: BookChatResponse = await res.json();
                    setMessages(data.messages);
                    setFileUrl(`${API_BASE}/file/${data.file_id}`);
                    setFileId(data.file_id);
                } catch (err) {
                    console.error(err);
                }
            }
        };
        fetchChatData();
    }, [chatId]);

    useEffect(() => {
        // Track page view
        trackPageView('book_chat');
    }, []);

    const handleProcessClick = () => {
        setIsModalOpen(true);
    };

    const handlePageInputSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!pdfPageData) return;
        const page = parseInt(pageInputValue);
        if (page < 1 || page > pdfPageData.numPages) return;
        
        // Clear input value
        setPageInputValue('');
        
        // Trigger page jump in PDFViewer by setting currentPageRange
        // The PDFViewer expects start: -1 and end: pageNumber as a signal
        setPdfPageData({ 
            ...pdfPageData, 
            currentPage: page, 
            isJumping: true,
            startPage: -1, // Signal to PDFViewer to jump
            endPage: page  // Target page number
        });
    };

    const handleNumPagesChange = useCallback((numPages: number) => {
        setTotalPages(numPages);
        // Initialize pdfPageData when we get the number of pages
        setPdfPageData({
            currentPage: 1,
            numPages: numPages,
            startPage: 1,
            endPage: numPages,
            isJumping: false,
            isLoading: false
        });
    }, []);

    const handleJumpToPage = useCallback((page: number) => {
        if (pdfPageData && pdfPageData.currentPage !== page) {
            setPdfPageData({ ...pdfPageData, currentPage: page });
        }
    }, [pdfPageData]);

    const handleJumpingChange = useCallback((jumping: boolean) => {
        if (pdfPageData && pdfPageData.isJumping !== jumping) {
            // If jumping is complete (false), reset the jump signal
            if (!jumping && pdfPageData.startPage === -1) {
                // Reset the jump signal by setting startPage to the actual current page
                // This prevents the PDFViewer from continuously triggering jumps
                setPdfPageData({ 
                    ...pdfPageData, 
                    isJumping: jumping,
                    startPage: pdfPageData.currentPage - 2, // Set to a reasonable range around current page
                    endPage: pdfPageData.currentPage + 2
                });
            } else {
                setPdfPageData({ ...pdfPageData, isJumping: jumping });
            }
        }
    }, [pdfPageData]);

    const handlePageRangeChange = useCallback((start: number, end: number) => {
        if (pdfPageData && (pdfPageData.startPage !== start || pdfPageData.endPage !== end)) {
            // Only update if we're not in the middle of a jump signal
            if (start !== -1) {
                setPdfPageData({ ...pdfPageData, startPage: start, endPage: end });
            }
        }
    }, [pdfPageData]);

    const handlePageRangeSubmit = async (start: number, end: number) => {
        setIsModalOpen(false);
        if (!fileId) return;

        try {
            setIsProcessingDoc(true);

            const processRes = await authFetch(`${API_BASE}/process/${fileId}?from_page=${start}&to_page=${end}`, {
                method: 'POST',
            });

            if (!processRes.ok) throw new Error('Failed to process document.');
            
            console.log('Document processed successfully');

        } catch (err) {
            console.error("Error during document processing:", err);
        } finally {
            setIsProcessingDoc(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || !chatId) return;

        const userMessage: BookChatMessage = {
            role: 'user',
            content: inputValue,
            created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMessage]);
        const prompt = inputValue;
        setInputValue('');

        try {
            const res = await authFetch(`${API_BASE}/api/book-chats/${chatId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: 'user', content: prompt }),
            });
            if (!res.ok) throw new Error('Failed to send message');
            const data = await res.json();
            setMessages((prev) => [...prev, data.ai_response]);
            
            // Track book chat message
            trackChatMessage('book');
        } catch (err) {
            console.error(err);
            trackError('book_chat_message_failed', err instanceof Error ? err.message : 'Unknown error');
        }
    };
    
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleNotesModalClose = () => {
        setShowNotesModal(false);
        setCreatedNote(null);
    };

    const handleNoteUpdate = async (updatedNote: CreatedNote) => {
        try {
            // Update note via API if needed
            console.log('Note updated:', updatedNote);
            setCreatedNote(updatedNote);
        } catch (error) {
            console.error('Error updating note:', error);
        }
    };

    return (
        <div className="flex h-full w-full bg-white dark:bg-[#1b1b1b] text-gray-900 dark:text-white">
            <div className="flex-[5] flex flex-col border-r border-gray-300 dark:border-gray-700 h-full">
                <div className="p-4 border-b border-gray-300 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Document Viewer</h2>
                    <div className="flex-1 flex justify-center gap-4">
                    {pdfPageData && (
                            <form onSubmit={handlePageInputSubmit} className="flex items-center gap-2 bg-gray-900/90 text-white px-4 py-2 rounded-lg border border-cyan-500 shadow-lg text-sm">
                                <span>Страница</span>
                                <input
                                    id="pdf-page-jump-input"
                                    type="number"
                                    value={pageInputValue}
                                    onChange={(e) => setPageInputValue(e.target.value)}
                                    placeholder={`${pdfPageData.startPage}-${pdfPageData.endPage}`}
                                    min="1"
                                    max={pdfPageData.numPages}
                                    disabled={pdfPageData.isJumping || pdfPageData.isLoading}
                                    className="w-20 px-2 py-1 bg-gray-800 text-white rounded border border-gray-700 focus:border-cyan-500 focus:outline-none text-center"
                                />
                                <span>из {pdfPageData.numPages}</span>
                                <button
                                    type="submit"
                                    disabled={pdfPageData.isJumping || pageInputValue === ''}
                                    className="ml-2 px-3 py-1 bg-cyan-500 hover:bg-cyan-600 text-black rounded transition-colors disabled:opacity-50"
                                >
                                    Перейти
                                </button>
                            </form>
                        )}
                        </div>
                    <button
                        onClick={handleProcessClick}
                        disabled={isProcessingDoc || !fileId}
                        className={`bg-cyan-500 hover:bg-cyan-600 text-black py-2 px-4 rounded ${isProcessingDoc ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isProcessingDoc ? 'Processing...' : 'Process'}
                    </button>

                </div>
                {fileUrl && (
                  <PDFViewer 
                    fileUrl={fileUrl} 
                    onNumPagesChange={handleNumPagesChange}
                    onJumpToPage={handleJumpToPage}
                    onJumpingChange={handleJumpingChange}
                    onPageRangeChange={handlePageRangeChange}
                    currentPageRange={pdfPageData ? { start: pdfPageData.startPage, end: pdfPageData.endPage } : undefined}
                  />
                )}
            </div>
            <div className="flex-[4] flex flex-col h-full">
                <div className="flex-1 overflow-y-auto min-h-0">
                    {messages.map((msg, index) => (
                        <ChatMessage key={index} message={msg} onAddNote={(text: string) => addNote("Book Chat Note", text)} />
                    ))}
                    <div ref={chatEndRef} />
                </div>
                <div className="p-4 border-t border-gray-300 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        {chatId && messages.length > 0 && (
                            <CreateNotesButton
                                chatId={chatId}
                                chatType="book_chat"
                                onNotesCreated={(note) => {
                                    // Convert StructuredNote to CreatedNote format
                                    const createdNote: CreatedNote = {
                                        title: note.title,
                                        meaning: note.meaning,
                                        association: note.association,
                                        personal_relevance: note.personal_relevance,
                                        importance: note.importance,
                                        implementation_plan: note.implementation_plan || '',
                                    };
                                    
                                    // Set the created note and show modal automatically
                                    setCreatedNote(createdNote);
                                    setShowNotesModal(true);
                                    
                                    // Add success message to chat
                                    const successMessage: BookChatMessage = {
                                        role: 'assistant',
                                        content: '✅ Заметка успешно создана с помощью ИИ!',
                                        created_at: new Date().toISOString(),
                                    };
                                    setMessages(prev => [...prev, successMessage]);
                                }}
                                onError={(error) => {
                                    console.error('Create notes error:', error);
                                    const errorMessage: BookChatMessage = {
                                        role: 'assistant',
                                        content: `❌ Ошибка при создании заметки: ${error}`,
                                        created_at: new Date().toISOString(),
                                    };
                                    setMessages(prev => [...prev, errorMessage]);
                                }}
                                className="bg-blue-600/80 text-white border border-blue-400/30 hover:bg-blue-700/80"
                                disabled={!chatId}
                            />
                        )}
                    </div>
                    <form onSubmit={handleSendMessage} className="relative">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Ask a question about the book..."
                            className="bg-gray-100 dark:bg-[#1b1b1b] border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white w-full rounded-full py-3 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                        <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 bg-cyan-100 hover:bg-cyan-200 text-black p-2 rounded-full transition-colors w-10 h-10 flex items-center justify-center">
                          <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        style={{ transform: 'rotate(270deg)' }} // лучше задать через стиль
                        >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M2 12h17m-7-7l7 7-7 7"
                        />
                          </svg>
                      </button>
                    </form>
                </div>
            </div>
            <PageRangeModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handlePageRangeSubmit}
                totalPages={totalPages}
            />
            {/* Notes Created Modal */}
            <NotesCreatedModal
                isOpen={showNotesModal}
                onClose={handleNotesModalClose}
                createdNote={createdNote}
                onNoteUpdate={handleNoteUpdate}
            />
        </div>
    );
};

export default BookChatPage; 