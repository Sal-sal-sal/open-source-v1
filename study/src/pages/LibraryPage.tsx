import React, { useState, useEffect } from 'react';
import { Search, Book, Download, Headphones, Star, Clock, User, Loader2 } from 'lucide-react';
import { authFetch } from '../utils/auth';
import { getGradient } from '../utils/gradients';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';

interface Book {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  number_of_pages_median?: number;
  ratings_average?: number;
  ratings_count?: number;
  subject?: string[];
  language?: string[];
  ebook_access?: string;
  public_scan_b?: boolean;
}

interface SearchResult {
  numFound: number;
  start: number;
  docs: Book[];
}

const LibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isConverting, setIsConverting] = useState(false);


  const searchBooks = async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      // Open Library Search API
      const response = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20&fields=key,title,author_name,cover_i,first_publish_year,number_of_pages_median,ratings_average,ratings_count,subject,language,ebook_access,public_scan_b`
      );
      const data: SearchResult = await response.json();
      setSearchResults(data.docs);
    } catch (error) {
      console.error('Error searching books:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchBooks(searchQuery);
  };

  const getCoverUrl = (coverId: number) => {
    return `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
  };

  const getAuthorDisplay = (authors: string[] | undefined) => {
    if (!authors || authors.length === 0) return 'Unknown Author';
    return authors.join(', ');
  };

  const downloadBook = async (book: Book) => {
    setIsConverting(true);
    setSelectedBook(book);

    try {
      // Get book details from Open Library
      const bookResponse = await fetch(`https://openlibrary.org${book.key}.json`);
      const bookData = await bookResponse.json();

      // Try to get text content
      let textContent = '';
      
      if (bookData.description) {
        textContent = typeof bookData.description === 'string' 
          ? bookData.description 
          : bookData.description.value || '';
      }

      if (bookData.excerpts && bookData.excerpts.length > 0) {
        textContent += '\n\n' + bookData.excerpts.map((excerpt: any) => excerpt.text).join('\n\n');
      }

      if (bookData.first_sentence?.value) {
        textContent += '\n\n' + bookData.first_sentence.value;
      }

      if (!textContent) {
        textContent = `${book.title} by ${getAuthorDisplay(book.author_name)}. ${bookData.first_sentence?.value || 'This book is available in the Open Library collection.'}`;
      }

      // Create a new PDF document
      const pdf = new jsPDF();
      
      // Set font and size
      pdf.setFont('helvetica');
      pdf.setFontSize(12);
      
      // Add title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(book.title, 20, 20);
      
      // Add author
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      const authorText = `by ${getAuthorDisplay(book.author_name)}`;
      pdf.text(authorText, 20, 30);
      
      // Add content with proper line wrapping
      pdf.setFontSize(10);
      const maxWidth = 170; // Maximum width for text
      const lineHeight = 6;
      let yPosition = 45;
      
      // Split text into lines that fit within the page width
      const lines = pdf.splitTextToSize(textContent, maxWidth);
      
      for (let i = 0; i < lines.length; i++) {
        // Check if we need a new page
        if (yPosition > 280) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(lines[i], 20, yPosition);
        yPosition += lineHeight;
      }

      // Create download link
      const pdfBlob = pdf.output('blob');
      const fileName = `${book.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      const url = URL.createObjectURL(pdfBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error downloading book:', error);
      console.error('Error details:', {
        book: book.title,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      alert(`Failed to download book "${book.title}". Please try again.`);
    } finally {
      setIsConverting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="relative min-h-screen p-6 overflow-hidden">
      {/* Видео фон Library */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{ filter: 'brightness(0.3)' }}
      >
        <source src="/resurses/library.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Затемнение поверх видео */}
      <div className="absolute inset-0 bg-black/40 z-10"></div>
      
      {/* Контент */}
      <div className="relative z-20 max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            <Book className="inline-block mr-3 text-purple-400" />
            LearnTug - Платформа для Обучения
          </h1>
          <p className="text-lg text-white/80 mb-4">
            Загружайте аудио, создавайте заметки и изучайте материалы в один клик
          </p>
          
          {/* Audio Library Button */}
          <button
            onClick={() => navigate('/audio-library')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Headphones className="h-5 w-5" />
            Аудио Библиотека
          </button>
        </div>

        {/* Search Section */}
        <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-white">Поиск Книг и Материалов</h2>
          
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск книг по названию, автору или теме..."
                className="w-full px-4 py-3 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white/10 text-white placeholder-white/60"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !searchQuery.trim()}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <Loader2 className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  Searching...
                </div>
              ) : (
                <div className="flex items-center">
                  <Search className="mr-2" />
                  Найти
                </div>
              )}
            </button>
          </form>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-white">
              Результаты Поиска ({searchResults.length} книг найдено)
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((book) => (
                <div key={book.key} className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-lg p-4 hover:shadow-md hover:scale-105 hover:shadow-purple-500/50 transition-all duration-300 ease-in-out">
                  <div className="flex gap-4">
                    {book.cover_i ? (
                      <img
                        src={getCoverUrl(book.cover_i)}
                        alt={book.title}
                        className="w-20 h-28 object-cover rounded"
                      />
                    ) : (
                      <div className="w-20 h-28 bg-gray-200 rounded flex items-center justify-center">
                        <Book className="text-white" />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1 line-clamp-2">
                        {book.title}
                      </h3>
                      <p className="text-sm text-white mb-2">
                        by {getAuthorDisplay(book.author_name)}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                        {book.first_publish_year && (
                          <span className="flex items-center">
                            <Clock className="mr-1" />
                            {book.first_publish_year}
                          </span>
                        )}
                        {book.ratings_average && (
                          <span className="flex items-center">
                            <Star className="mr-1 text-yellow-500" />
                            {book.ratings_average.toFixed(1)}
                          </span>
                        )}
                      </div>
                      
                      <button
                        onClick={() => downloadBook(book)}
                        disabled={isConverting && selectedBook?.key === book.key}
                        className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        {isConverting && selectedBook?.key === book.key ? (
                          <div className="flex items-center justify-center">
                            <Loader2 className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Скачивание...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <Download className="mr-2" />
                            Скачать
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}



        {/* Popular Books Section */}
        <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-white">Популярные Книги</h2>
          <p className="text-gray-400 mb-4">
            Попробуйте найти популярные книги: "Великий Гэтсби", "1984", "Гордость и предубеждение", 
            "Убить пересмешника" или "Хоббит" для начала.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "The Great Gatsby", author: "F. Scott Fitzgerald", year: 1925 },
              { title: "1984", author: "George Orwell", year: 1949 },
              { title: "Pride and Prejudice", author: "Jane Austen", year: 1813 },
              { title: "To Kill a Mockingbird", author: "Harper Lee", year: 1960 }
            ].map((book, index) => (
              <div key={index} className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-lg p-4 text-center">
                <Book className="mx-auto h-8 w-8 text-purple-600 mb-2" />
                <h3 className="font-semibold text-white text-sm mb-1">{book.title}</h3>
                <p className="text-xs text-white">{book.author}</p>
                <p className="text-xs text-white">{book.year}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LibraryPage; 