import React, { useState, useEffect } from 'react';

interface PageRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (start: number, end: number) => void;
  totalPages: number;
}

const PageRangeModal: React.FC<PageRangeModalProps> = ({ isOpen, onClose, onSubmit, totalPages }) => {
  const [startPage, setStartPage] = useState<string>('1');
  const [endPage, setEndPage] = useState<string>(totalPages.toString());
  const [error, setError] = useState<string>('');

  useEffect(() => {
    setEndPage(totalPages.toString());
  }, [totalPages]);

  if (!isOpen) {
    return null;
  }

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartPage(e.target.value);
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndPage(e.target.value);
  };

  const handleSubmit = () => {
    const start = parseInt(startPage, 10);
    const end = parseInt(endPage, 10);

    if (isNaN(start) || isNaN(end)) {
      setError('Please enter valid numbers.');
      return;
    }
    if (start < 1) {
      setError('Start page must be at least 1.');
      return;
    }
    if (end > totalPages) {
      setError(`End page cannot be greater than ${totalPages}.`);
      return;
    }
    if (start > end) {
      setError('Start page cannot be greater than end page.');
      return;
    }

    setError('');
    onSubmit(start, end);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Select Page Range</h2>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Total pages: {totalPages}
        </p>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <div className="flex items-center space-x-4">
          <input
            type="number"
            value={startPage}
            onChange={handleStartChange}
            className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
            placeholder="Start"
          />
          <span className="text-gray-500 dark:text-gray-400">to</span>
          <input
            type="number"
            value={endPage}
            onChange={handleEndChange}
            className="w-full p-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
            placeholder="End"
          />
        </div>
        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded bg-cyan-500 hover:bg-cyan-600 text-white"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default PageRangeModal; 