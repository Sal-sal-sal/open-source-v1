import React from 'react';

const BookChatView: React.FC = () => {
    return (
        <div className="flex h-full w-full bg-white dark:bg-[#1b1b1b] text-gray-900 dark:text-white">
            <div className="flex-[5] flex flex-col border-r border-gray-300 dark:border-gray-700 h-full">
                <div className="p-4 border-b border-gray-300 dark:border-gray-700">
                    <h2 className="text-lg font-semibold">Book Text</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    <p>Book text will be displayed here.</p>
                </div>
            </div>
            <div className="flex-[4] flex flex-col h-full">
                <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="p-4 text-center text-gray-400 dark:text-gray-500">
                        Ask a question about the book.
                    </div>
                </div>
                <div className="p-4 border-t border-gray-300 dark:border-gray-700">
                    <form className="relative">
                        <input
                            type="text"
                            placeholder="Ask your question"
                            className="bg-gray-100 dark:bg-[#1b1b1b] border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white w-full rounded-full py-3 pl-6 pr-32 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                        <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 bg-cyan-500 hover:bg-cyan-600 text-black p-2 rounded-full transition-colors w-10 h-10 flex items-center justify-center">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" transform="rotate(270 12 12)"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14m-7-7l7 7-7 7"/></svg>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default BookChatView; 