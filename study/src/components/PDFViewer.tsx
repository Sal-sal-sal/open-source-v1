import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  fileUrl: string;
  onNumPagesChange: (numPages: number) => void;
  currentPageRange?: { start: number; end: number };
  onJumpToPage?: (page: number) => void;
  onPageRangeChange?: (start: number, end: number) => void;
  isJumping?: boolean;
  onJumpingChange?: (jumping: boolean) => void;
}

const WINDOW_SIZE = 10; // Total pages to keep in memory
const LOAD_STEP = 5; // Pages to load/unload at a time

export const PDFViewer: React.FC<PDFViewerProps> = ({ 
  fileUrl, 
  onNumPagesChange, 
  currentPageRange, 
  onJumpToPage,
  onPageRangeChange,
  isJumping: externalIsJumping,
  onJumpingChange
}) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(WINDOW_SIZE);
  const [isLoading, setIsLoading] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [pageInputValue, setPageInputValue] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef<number>(0);

  // Notify parent of page range changes
  useEffect(() => {
    if (onPageRangeChange && numPages) {
      onPageRangeChange(startPage, endPage);
    }
  }, [startPage, endPage, numPages]); // Removed onPageRangeChange from dependencies

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log(`PDF loaded with ${numPages} pages`);
    setNumPages(numPages);
    setEndPage(Math.min(WINDOW_SIZE, numPages));
    onNumPagesChange(numPages);
    // Notify parent about current page range
    if (currentPageRange) {
      setStartPage(currentPageRange.start);
      setEndPage(currentPageRange.end);
    }
  };

  const jumpToPage = useCallback((targetPage: number) => {
    if (!numPages || targetPage < 1 || targetPage > numPages) return;
    
    if (onJumpingChange) {
      onJumpingChange(true);
    } else {
      setIsJumping(true);
    }
    
    // Calculate new range - 5 pages before and 5 pages after
    const halfWindow = Math.floor(WINDOW_SIZE / 2);
    let newStart = Math.max(1, targetPage - halfWindow);
    let newEnd = Math.min(numPages, targetPage + halfWindow);
    
    // Adjust if we're near the edges
    if (newEnd - newStart + 1 < WINDOW_SIZE) {
      if (newStart === 1) {
        newEnd = Math.min(numPages, WINDOW_SIZE);
      } else if (newEnd === numPages) {
        newStart = Math.max(1, numPages - WINDOW_SIZE + 1);
      }
    }
    
    console.log(`Jumping to page ${targetPage}. New range: ${newStart}-${newEnd}`);
    
    setStartPage(newStart);
    setEndPage(newEnd);
    
    // Notify parent if callback provided
    if (onJumpToPage) {
      onJumpToPage(targetPage);
    }
    
    // After state update, scroll to the target page
    setTimeout(() => {
      const container = containerRef.current;
      if (container) {
        const targetElement = container.querySelector(`[data-page-number="${targetPage}"]`);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
      if (onJumpingChange) {
        onJumpingChange(false);
      } else {
        setIsJumping(false);
      }
    }, 100);
  }, [numPages, onJumpToPage, onJumpingChange]);

  // Handle external page jump requests
  useEffect(() => {
    if (currentPageRange && currentPageRange.start === -1 && currentPageRange.end > 0) {
      // This is a signal to jump to a specific page (stored in end)
      jumpToPage(currentPageRange.end);
    }
  }, [currentPageRange, jumpToPage]);

  const loadMorePagesDown = useCallback(() => {
    if (!numPages || isLoading || endPage >= numPages) return;
    
    setIsLoading(true);
    const container = containerRef.current;
    const scrollBefore = container?.scrollTop || 0;
    
    console.log(`Loading more pages down. Current: ${startPage}-${endPage}`);
    
    // Calculate new range
    const newEnd = Math.min(numPages, endPage + LOAD_STEP);
    const newStart = Math.min(startPage + LOAD_STEP, Math.max(1, newEnd - WINDOW_SIZE + 1));
    
    // Store the height of pages we're about to remove
    let removedHeight = 0;
    if (newStart > startPage && container) {
      for (let i = startPage; i < newStart; i++) {
        const pageEl = container.querySelector(`[data-page-number="${i}"]`);
        if (pageEl) {
          removedHeight += pageEl.getBoundingClientRect().height;
        }
      }
    }
    
    setStartPage(newStart);
    setEndPage(newEnd);
    
    // Adjust scroll position after state update
    setTimeout(() => {
      if (container && removedHeight > 0) {
        container.scrollTop = scrollBefore - removedHeight;
      }
      setIsLoading(false);
    }, 100);
    
    console.log(`New range: ${newStart}-${newEnd}`);
  }, [numPages, startPage, endPage, isLoading]);

  const loadMorePagesUp = useCallback(() => {
    if (!numPages || isLoading || startPage <= 1) return;
    
    setIsLoading(true);
    const container = containerRef.current;
    const scrollBefore = container?.scrollTop || 0;
    
    console.log(`Loading more pages up. Current: ${startPage}-${endPage}`);
    
    // Calculate new range
    const newStart = Math.max(1, startPage - LOAD_STEP);
    const newEnd = Math.max(endPage - LOAD_STEP, Math.min(numPages, newStart + WINDOW_SIZE - 1));
    
    setStartPage(newStart);
    setEndPage(newEnd);
    
    // After state update, adjust scroll to maintain position
    setTimeout(() => {
      if (container) {
        // Calculate the height of newly added pages
        let addedHeight = 0;
        for (let i = newStart; i < startPage; i++) {
          const pageEl = container.querySelector(`[data-page-number="${i}"]`);
          if (pageEl) {
            addedHeight += pageEl.getBoundingClientRect().height;
          }
        }
        container.scrollTop = scrollBefore + addedHeight;
      }
      setIsLoading(false);
    }, 100);
    
    console.log(`New range: ${newStart}-${newEnd}`);
  }, [numPages, startPage, endPage, isLoading]);

  useEffect(() => {
    const options = {
      root: containerRef.current,
      rootMargin: '100px',
      threshold: 0.1
    };

    const topObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && containerRef.current) {
          const currentScrollTop = containerRef.current.scrollTop;
          // Only load if scrolling up
          if (currentScrollTop < lastScrollTop.current) {
            loadMorePagesUp();
          }
          lastScrollTop.current = currentScrollTop;
        }
      });
    }, options);

    const bottomObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && containerRef.current) {
          const currentScrollTop = containerRef.current.scrollTop;
          // Only load if scrolling down
          if (currentScrollTop > lastScrollTop.current) {
            loadMorePagesDown();
          }
          lastScrollTop.current = currentScrollTop;
        }
      });
    }, options);

    if (topSentinelRef.current) {
      topObserver.observe(topSentinelRef.current);
    }
    if (bottomSentinelRef.current) {
      bottomObserver.observe(bottomSentinelRef.current);
    }

    return () => {
      topObserver.disconnect();
      bottomObserver.disconnect();
    };
  }, [loadMorePagesUp, loadMorePagesDown]);

  // Handle page input submit
  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(pageInputValue, 10);
    if (!isNaN(pageNum)) {
      jumpToPage(pageNum);
      setPageInputValue('');
    }
  };

  // Keyboard shortcut to focus on input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key) && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        const input = document.getElementById('pdf-page-jump-input');
        if (input instanceof HTMLInputElement) {
          input.focus();
          setPageInputValue(e.key);
        }
      }
    };
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, []);

  const pages = [];
  if (numPages) {
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <div 
          key={`page_${i}`} 
          data-page-number={i}
          className="mb-4 bg-white dark:bg-gray-900 shadow-xl rounded-lg overflow-hidden"
        >
          <div className="p-1 bg-gray-200 dark:bg-gray-700 text-center text-sm">
            Страница {i}
          </div>
          <Page 
            pageNumber={i} 
            width={800}
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </div>
      );
    }
  }

  return (
    <div 
      ref={containerRef}
      className="w-full h-full overflow-y-auto bg-gray-100 dark:bg-gray-800"
    >

      <Document
        file={fileUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={
          <div className="flex items-center justify-center h-full">
            <div className="text-lg">Загрузка PDF...</div>
          </div>
        }
        error={
          <div className="flex items-center justify-center h-full">
            <div className="text-red-500">Ошибка загрузки PDF</div>
          </div>
        }
      >
        <div className="max-w-4xl mx-auto p-4">
          {/* Top sentinel */}
          {startPage > 1 && (
            <div ref={topSentinelRef} className="h-20 flex items-center justify-center">
              {isLoading && <div className="text-gray-500">Загрузка предыдущих страниц...</div>}
            </div>
          )}
          
          {/* Pages */}
          {pages}
          
          {/* Bottom sentinel */}
          {endPage < (numPages || 0) && (
            <div ref={bottomSentinelRef} className="h-20 flex items-center justify-center">
              {isLoading && <div className="text-gray-500">Загрузка следующих страниц...</div>}
            </div>
          )}
        </div>
      </Document>
    </div>
  );
}; 