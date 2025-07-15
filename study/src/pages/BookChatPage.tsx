import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { authFetch } from '../utils/auth';
import { PDFViewer } from '../components/PDFViewer';
import ReactMarkdown from 'react-markdown';
import type { BookChatResponse, BookChatMessage } from '../types/book-chat';
import { PlusCircle } from 'lucide-react';
import { useNotes } from '../contexts/NotesContext';
import PageRangeModal from '../components/PageRangeModal';
import { createBookChat } from '../utils/chat';

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

    const handleProcessClick = () => {
        setIsModalOpen(true);
    };

    const handleNumPagesChange = (numPages: number) => {
        setTotalPages(numPages);
    };

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
        } catch (err) {
            console.error(err);
        }
    };
    
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="flex h-full w-full bg-white dark:bg-[#1b1b1b] text-gray-900 dark:text-white">
            <div className="flex-[5] flex flex-col border-r border-gray-300 dark:border-gray-700 h-full">
                <div className="p-4 border-b border-gray-300 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Document Viewer</h2>
                    <button
                        onClick={handleProcessClick}
                        disabled={isProcessingDoc || !fileId}
                        className={`bg-cyan-500 hover:bg-cyan-600 text-black py-2 px-4 rounded ${isProcessingDoc ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isProcessingDoc ? 'Processing...' : 'Process'}
                    </button>
                </div>
                {fileUrl && <PDFViewer fileUrl={fileUrl} onNumPagesChange={handleNumPagesChange} />}
            </div>
            <div className="flex-[4] flex flex-col h-full">
                <div className="flex-1 overflow-y-auto min-h-0">
                    {messages.map((msg, index) => (
                        <ChatMessage key={index} message={msg} onAddNote={addNote} />
                    ))}
                    <div ref={chatEndRef} />
                </div>
                <div className="p-4 border-t border-gray-300 dark:border-gray-700">
                    <form onSubmit={handleSendMessage} className="relative">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Ask a question about the book..."
                            className="bg-gray-100 dark:bg-[#1b1b1b] border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white w-full rounded-full py-3 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
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
        </div>
    );
};

export default BookChatPage; 