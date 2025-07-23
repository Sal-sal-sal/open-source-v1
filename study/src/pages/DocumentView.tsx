import React, { useState, useRef, useEffect } from 'react';
import { useNotes } from '../contexts/NotesContext';
import { PlusCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { createBookChat } from '../utils/chat';
import { authFetch } from '../utils/auth';
import { PDFViewer } from '../components/PDFViewer';
import PageRangeModal from '../components/PageRangeModal';
import { useNavigate } from 'react-router-dom';
import { FileUploadForm } from '../components/FileUploadForm';
import type { FileUploadResponse } from '../types/index';
import { trackFileUpload, trackDocumentProcessed, trackPageView, trackError } from '../utils/analytics';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// --- TYPE DEFINITIONS ---
interface Message {
    id: number;
    text: string;
    sender: 'user' | 'assistant';
    timestamp: string;
}

// --- SUB-COMPONENTS ---
const ChatMessage: React.FC<{ message: Message, onAddNote: (header: string, text: string) => void }> = ({ message, onAddNote }) => {
    const isAssistant = message.sender === 'assistant';
    return (
        <div className={`py-3 group relative ${isAssistant ? '' : 'bg-gray-200/50 dark:bg-gray-800/30'}`}>
            <div className="max-w-4xl mx-auto flex items-start gap-3 px-4">
                <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm ${isAssistant ? 'bg-cyan-500' : 'bg-pink-500'}`}>
                    {isAssistant ? 'G' : 'S'}
                </div>
                <div className="flex-1 pt-0.5">
                    <p className="font-bold mb-1 text-sm">{isAssistant ? 'GamingAI' : 'Saladin'}</p>
                    <div className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">{message.text}</div>
                </div>
                {isAssistant && (
                    <button 
                        onClick={() => onAddNote('Note', message.text)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-cyan-400 dark:hover:text-cyan-500"
                        title="Create note from this message"
                    >
                        <PlusCircle className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    );
};

// --- MAIN DOCUMENT VIEW COMPONENT ---
const DocumentView: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    // Document State
    const [file, setFile] = useState<File | null>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [chatId, setChatId] = useState<string | null>(null);
    const [fileId, setFileId] = useState<string | null>(null);
    const [totalPages, setTotalPages] = useState<number>(0);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isProcessingDoc, setIsProcessingDoc] = useState<boolean>(false);
    
    // Page navigation state
    const [pageInputValue, setPageInputValue] = useState('');
    const [isJumping, setIsJumping] = useState(false);
    const [currentPageRange, setCurrentPageRange] = useState({ start: 1, end: 10 });
    const [jumpToPageSignal, setJumpToPageSignal] = useState<{ start: number; end: number } | undefined>();
    
    // Chat State
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);
    const { addNote } = useNotes();

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    useEffect(() => {
        // Track page view
        trackPageView('document_view');
    }, []);

    // Handle keyboard shortcuts for page navigation
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Check if the user is typing a number and not in an input field
            if (/^[0-9]$/.test(e.key) && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
                const input = document.getElementById('page-jump-input');
                if (input instanceof HTMLInputElement) {
                    input.focus();
                    setPageInputValue(e.key);
                }
            }
        };

        window.addEventListener('keypress', handleKeyPress);
        return () => window.removeEventListener('keypress', handleKeyPress);
    }, []);

    const handleUploadSuccess = (response: FileUploadResponse) => {
      if (response.book_chat_id) {
        navigate(`/book-chat/${response.book_chat_id}`);
      }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const uploadedFile = e.target.files[0];
            setFile(uploadedFile);
            setMessages([]); // Clear chat on new file

            // Create object URL for the file for local viewing
            const url = URL.createObjectURL(uploadedFile);
            setFileUrl(url);

            try {
                // Upload document to get fileId
                const formData = new FormData();
                formData.append('file', uploadedFile);
                const uploadRes = await authFetch(`${API_BASE}/upload`, {
                    method: 'POST',
                    body: formData,
                });
                if (!uploadRes.ok) throw new Error('Failed to upload file.');
                const uploadData = await uploadRes.json();

                // Track file upload
                trackFileUpload(uploadedFile.type, uploadedFile.size);

                // Store fileId for later processing
                setFileId(uploadData.file_id);
            } catch (err) {
                console.error("Error during document upload:", err);
                trackError('document_upload_failed', err instanceof Error ? err.message : 'Unknown error');
            }
        }
    };

    const handleProcessClick = () => {
        setIsModalOpen(true);
    };

    const handleNumPagesChange = (numPages: number) => {
        setTotalPages(numPages);
    };

    const handlePageRangeChange = (start: number, end: number) => {
        setCurrentPageRange({ start, end });
    };

    const handleJumpToPage = (page: number) => {
        // Signal PDFViewer to jump to page using special range values
        setJumpToPageSignal({ start: -1, end: page });
        // Clear signal after a moment
        setTimeout(() => setJumpToPageSignal(undefined), 100);
    };

    const handlePageInputSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const pageNum = parseInt(pageInputValue, 10);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
            handleJumpToPage(pageNum);
            setPageInputValue('');
        }
    };

    const handlePageRangeSubmit = async (start: number, end: number) => {
        setIsModalOpen(false);
        if (!file) return;

        try {
            if (!fileId) throw new Error('File not uploaded');

            setIsProcessingDoc(true);

            const processRes = await authFetch(`${API_BASE}/process/${fileId}?from_page=${start}&to_page=${end}`, {
                method: 'POST',
            });

            if (!processRes.ok) throw new Error('Failed to process document.');
            
            console.log('Document processed successfully');
            
            // Track document processing
            trackDocumentProcessed('pdf', end - start + 1);

            // After processing, create BookChat
            const newChat = await createBookChat(fileId, file.name);
            if (newChat && newChat.id) {
                setChatId(newChat.id);
            }
            
            // Handle success, e.g., show a notification
            console.log('Document processed and chat created successfully');

        } catch (err) {
            console.error("Error during document processing and chat creation:", err);
            trackError('document_processing_failed', err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsProcessingDoc(false);
        }
    };

    useEffect(() => {
        // Cleanup object URL when component unmounts
        return () => {
            if (fileUrl) {
                URL.revokeObjectURL(fileUrl);
            }
        };
    }, [fileUrl]);

    const handleSendMessage = async (e: React.FormEvent | Event, overridePrompt?: string) => {
        e.preventDefault();
        const finalPrompt = overridePrompt || inputValue;
        if(!finalPrompt.trim() || !chatId) return;

        const userMessage: Message = { id: Date.now(), text: finalPrompt, sender: 'user', timestamp: '' };
        setMessages(prev => [...prev, userMessage]);
        const userPrompt = finalPrompt;
        setInputValue('');

        // Send message to the document-specific chat
        try {
            const res = await authFetch(`${API_BASE}/api/book-chats/${chatId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: userPrompt, role: 'user' })
            });
            
            if (!res.ok) {
                throw new Error(`Server returned ${res.status}`);
            }
            
            const data = await res.json();
            const assistantResponse: Message = {
                id: Date.now() + 1,
                text: data.ai_response.content,
                sender: 'assistant',
                timestamp: ''
            };
            setMessages((prev) => [...prev, assistantResponse]);
        } catch (err) {
            console.error('Document chat message failed', err);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevent default new line
            handleSendMessage(e); // Submit the form
        } else if (e.key === 'Enter' && e.shiftKey) {
            // Allow default behavior (new line in textarea)
        }
    };

    if (!file) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-white dark:bg-[#1b1b1b] text-gray-900 dark:text-white p-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">{t('UploadDocument')}</h2>
                    <p className="mb-6 text-gray-500 dark:text-gray-400">{t('SelectPDF')}</p>
                    <FileUploadForm onUploadSuccess={handleUploadSuccess} />
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-full w-full bg-white dark:bg-[#1b1b1b] text-gray-900 dark:text-white">
            {/* Left Panel: Document Viewer */}
            <div className="flex-[5] flex flex-col border-r border-gray-300 dark:border-gray-700 h-full relative">
                <div className="p-4 border-b border-gray-300 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Documфыфent Viewer</h2>
                    <div className="flex items-center gap-2 bg-gray-200 dark:bg-[#ff7070] rounded-lg p-2">

                    </div>
                    
                    {/* (Navigation form moved to floating panel) */}
                    
                    <button
                        onClick={handleProcessClick}
                        disabled={isProcessingDoc || !fileId}
                        className={`bg-cyan-500 hover:bg-cyan-600 text-black py-2 px-4 rounded ${isProcessingDoc ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isProcessingDoc ? 'Processing...' : 'Process'}
                    </button>
                </div>
                {fileUrl && <PDFViewer 
                    fileUrl={fileUrl} 
                    onNumPagesChange={handleNumPagesChange}
                    currentPageRange={jumpToPageSignal || currentPageRange}
                    onPageRangeChange={handlePageRangeChange}
                    onJumpToPage={handleJumpToPage}
                    isJumping={isJumping}
                    onJumpingChange={setIsJumping}
                />}
                
                {/* Loading overlay for page jump */}
                {isJumping && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-xl">
                            <div className="flex items-center gap-3">
                                <svg className="animate-spin h-6 w-6 text-cyan-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                </svg>
                                <span className="text-gray-900 dark:text-white">Переход к странице...</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Panel: Chat Interface */}
            <div className="flex-[4] flex flex-col h-full relative">
                {isProcessingDoc && !chatId && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-[#1b1b1b]/70 z-10">
                        <svg className="animate-spin h-10 w-10 text-cyan-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                        </svg>
                    </div>
                )}
                <div className="flex-1 overflow-y-auto min-h-0">
                    {messages.length === 0 && <div className="p-4 text-center text-gray-400 dark:text-gray-500">{t('AskQuestionAboutDoc')}</div>}
                    {messages.map((msg) => (<ChatMessage key={msg.id} message={msg} onAddNote={addNote} />))}
                    <div ref={chatEndRef} />
                </div>
                <div className="p-4 border-t border-gray-300 dark:border-gray-700">
                    <form onSubmit={handleSendMessage} className="relative flex items-end">
                        <textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={t('AskYourQuestion')}
                            rows={1} // Start with one row
                            className="flex-1 bg-gray-100 dark:bg-[#1b1b1b] border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg py-3 pl-6 pr-14 resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-cyan-500 leading-tight mr-2"
                            style={{ maxHeight: '200px' }} // Max height before scroll
                        />
                         <button 
                            type="button" 
                            onClick={() => setIsModalOpen(true)}
                            className="absolute right-16 top-1/2 -translate-y-1/2 bg-gray-500 bg-[#1b1b1b]  text-white p-2 rounded-full transition-colors w-10 h-10 flex items-center justify-center"
                            title="Ask about specific pages"
                            disabled={!totalPages}
                         >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1z" />
                            </svg>
                         </button>
                         <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 bg-cyan-500 hover:bg-cyan-600 text-black p-2 rounded-full transition-colors w-10 h-10 flex items-center justify-center">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" transform="rotate(270 12 12)"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14m-7-7l7 7-7 7"/></svg>
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
            {/* Floating page navigation panel */}
            {/* PageJumpPanel removed since navigation is inside PDFViewer */}
        </div>
    );
};

export default DocumentView; 