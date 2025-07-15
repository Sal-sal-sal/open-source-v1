import React from 'react';
import ReactDOM from 'react-dom';

interface PageJumpPanelProps {
  totalPages: number;
  pageInputValue: string;
  onPageInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isJumping: boolean;
  currentRange: { start: number; end: number };
}

const PageJumpPanel: React.FC<PageJumpPanelProps> = ({
  totalPages,
  pageInputValue,
  onPageInputChange,
  onSubmit,
  isJumping,
  currentRange,
}) => {
  if (typeof document === 'undefined') return null;

  return ReactDOM.createPortal(
    totalPages > 0 ? (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] bg-gray-900/90 text-white px-4 py-2 rounded-lg border border-cyan-500 shadow-2xl text-sm">
        <form onSubmit={onSubmit} className="flex items-center gap-2">
          <span>Страница</span>
          <input
            type="number"
            value={pageInputValue}
            onChange={(e) => onPageInputChange(e.target.value)}
            placeholder={`${currentRange.start}-${currentRange.end}`}
            min="1"
            max={totalPages}
            className="w-20 px-2 py-1 bg-gray-800 text-white rounded border border-gray-700 focus:border-cyan-500 focus:outline-none text-center"
            disabled={isJumping}
            id="page-jump-input"
          />
          <span>из {totalPages}</span>
          <button
            type="submit"
            className="ml-2 px-3 py-1 bg-cyan-500 hover:bg-cyan-600 text-black rounded transition-colors disabled:opacity-50"
            disabled={isJumping || !pageInputValue}
          >
            Перейти
          </button>
        </form>
      </div>
    ) : null,
    document.body
  );
};

export default PageJumpPanel; 