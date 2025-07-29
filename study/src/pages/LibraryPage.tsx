import React, { useState, useEffect } from 'react';
import { Search, Book, Download, Headphones, Star, Clock, User, Loader2, Globe, FileText, Eye } from 'lucide-react';
import { authFetch } from '../utils/auth';
import { getGradient } from '../utils/gradients';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import { api } from '../api/client';

interface GutenbergBook {
  id: number;
  title: string;
  authors: string[];
  languages: string[];
  subjects: string[];
  download_count: number;
  formats: Record<string, string>;
  bookshelves: string[];
  media_type: string;
  cover_url?: string;
  text_url?: string;
  html_url?: string;
  epub_url?: string;
  kindle_url?: string;
}

interface SearchResult {
  books: GutenbergBook[];
  count: number;
  total: number;
  next?: string;
  previous?: string;
}

const LibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GutenbergBook[]>([]);
  const [popularBooks, setPopularBooks] = useState<GutenbergBook[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState<GutenbergBook | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isConvertingToAudio, setIsConvertingToAudio] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Load popular books on component mount
  useEffect(() => {
    loadPopularBooks();
  }, []);

  const loadPopularBooks = async () => {
    try {
      const books = await api.getPopularGutenbergBooks(8);
      setPopularBooks(books);
    } catch (error) {
      console.error('Error loading popular books:', error);
      setSearchError('Failed to load popular books. Please try again later.');
    }
  };

  const searchBooks = async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    setSearchError(null);
    try {
      const result = await api.searchGutenbergBooks({
        q: query,
        limit: 20
      });
      setSearchResults(result.books);
    } catch (error) {
      console.error('Error searching books:', error);
      setSearchError('Failed to search books. Please try again later.');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const searchByCategory = async (category: string) => {
    setIsLoading(true);
    setSearchError(null);
    setSelectedCategory(category);
    
    try {
      // Map frontend categories to more specific search terms
      const categoryMappings: Record<string, string> = {
        'Fiction': 'fiction',
        'Non-Fiction': 'non-fiction',
        'Poetry': 'poetry',
        'Drama': 'drama',
        'History': 'history',
        'Philosophy': 'philosophy',
        'Science': 'science',
        'Religion': 'religion',
        'Biography': 'biography',
        'Travel': 'travel',
        'Adventure': 'adventure',
        'Romance': 'romance',
        'Mystery': 'mystery',
        'Fantasy': 'fantasy',
        'Children\'s Literature': 'children'
      };

      const searchTerm = categoryMappings[category] || category.toLowerCase();
      
      console.log(`Searching for category: ${category} with term: ${searchTerm}`);
      
      const result = await api.searchGutenbergBooks({
        subject: searchTerm,
        limit: 30
      });
      
      console.log(`Found ${result.books.length} books for category: ${category}`);
      
      if (result.books.length === 0) {
        // Try alternative search if no results
        const alternativeResult = await api.searchGutenbergBooks({
          q: searchTerm,
          limit: 20
        });
        
        if (alternativeResult.books.length > 0) {
          setSearchResults(alternativeResult.books);
          console.log(`Found ${alternativeResult.books.length} books using alternative search`);
        } else {
          setSearchResults([]);
          setSearchError(`No books found for category "${category}". Try searching for a different category or use the search bar above.`);
        }
      } else {
        setSearchResults(result.books);
      }
    } catch (error) {
      console.error('Error searching by category:', error);
      setSearchError(`Failed to search for category "${category}". Please try again later or use the search bar above.`);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchBooks(searchQuery);
  };

  const getAuthorDisplay = (authors: string[]) => {
    if (!authors || authors.length === 0) return "Unknown Author";
    return authors.join(", ");
  };

  const cleanHtmlContent = (htmlContent: string) => {
    // Simple HTML cleaning for display
    return htmlContent
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .replace(/&quot;/g, '"') // Replace &quot; with "
      .replace(/&#39;/g, "'") // Replace &#39; with '
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  };

  const processHtmlForPdf = (htmlContent: string) => {
    // Enhanced HTML processing for PDF with better formatting
    let processedContent = htmlContent;
    
    // Replace HTML entities
    const entities = {
      '&nbsp;': ' ',
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&apos;': "'",
      '&mdash;': '—',
      '&ndash;': '–',
      '&hellip;': '...',
      '&ldquo;': '"',
      '&rdquo;': '"',
      '&lsquo;': "'",
      '&rsquo;': "'"
    };
    
    Object.entries(entities).forEach(([entity, replacement]) => {
      processedContent = processedContent.replace(new RegExp(entity, 'g'), replacement);
    });
    
    // Remove script and style tags completely
    processedContent = processedContent.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    processedContent = processedContent.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
    // Replace HTML tags with appropriate formatting
    processedContent = processedContent.replace(/<br\s*\/?>/gi, '\n');
    processedContent = processedContent.replace(/<p[^>]*>/gi, '\n\n');
    processedContent = processedContent.replace(/<\/p>/gi, '\n');
    processedContent = processedContent.replace(/<h[1-6][^>]*>/gi, '\n\n');
    processedContent = processedContent.replace(/<\/h[1-6]>/gi, '\n');
    processedContent = processedContent.replace(/<div[^>]*>/gi, '\n');
    processedContent = processedContent.replace(/<\/div>/gi, '\n');
    processedContent = processedContent.replace(/<li[^>]*>/gi, '\n• ');
    processedContent = processedContent.replace(/<\/li>/gi, '\n');
    processedContent = processedContent.replace(/<ul[^>]*>/gi, '\n');
    processedContent = processedContent.replace(/<\/ul>/gi, '\n');
    processedContent = processedContent.replace(/<ol[^>]*>/gi, '\n');
    processedContent = processedContent.replace(/<\/ol>/gi, '\n');
    processedContent = processedContent.replace(/<blockquote[^>]*>/gi, '\n\n"');
    processedContent = processedContent.replace(/<\/blockquote>/gi, '"\n\n');
    
    // Remove all remaining HTML tags
    processedContent = processedContent.replace(/<[^>]*>/g, '');
    
    // Clean up whitespace
    processedContent = processedContent.replace(/\n\s*\n/g, '\n\n'); // Remove empty lines
    processedContent = processedContent.replace(/\s+/g, ' '); // Replace multiple spaces
    processedContent = processedContent.replace(/\n\s+/g, '\n'); // Remove leading spaces after newlines
    processedContent = processedContent.replace(/\s+\n/g, '\n'); // Remove trailing spaces before newlines
    
    return processedContent.trim();
  };

  const getLanguageDisplay = (languages: string[]) => {
    if (!languages || languages.length === 0) return 'Unknown';
    return languages.join(', ');
  };

  const getSubjectsDisplay = (subjects: string[]) => {
    if (!subjects || subjects.length === 0) return 'General';
    return subjects.slice(0, 3).join(', ');
  };

  const downloadBook = async (book: GutenbergBook) => {
    setIsDownloading(true);
    setSelectedBook(book);

    try {
      // Get the full text content from Project Gutenberg
      const textResult = await api.getGutenbergBookText(book.id);
      
      if (!textResult.text || textResult.text.length < 1000) {
        throw new Error('Book text is too short or unavailable. Please try another book.');
      }

      // Process HTML content for better PDF formatting
      const processedText = processHtmlForPdf(textResult.text);

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
      const authorText = `by ${getAuthorDisplay(book.authors)}`;
      pdf.text(authorText, 20, 30);
      
      // Add metadata
      pdf.setFontSize(10);
      const languageText = `Language: ${getLanguageDisplay(book.languages)}`;
      pdf.text(languageText, 20, 40);
      
      const subjectsText = `Subjects: ${getSubjectsDisplay(book.subjects)}`;
      pdf.text(subjectsText, 20, 50);
      
      const downloadText = `Downloads: ${book.download_count.toLocaleString()}`;
      pdf.text(downloadText, 20, 60);
      
      // Add separator line
      pdf.setLineWidth(0.5);
      pdf.line(20, 70, 190, 70);
      
      // Add content with proper line wrapping
      pdf.setFontSize(10);
      const maxWidth = 170; // Maximum width for text
      const lineHeight = 6;
      let yPosition = 80;
      
      // Split processed text into lines that fit within the page width
      const lines = pdf.splitTextToSize(processedText, maxWidth);
      
      for (let i = 0; i < lines.length; i++) {
        // Check if we need a new page
        if (yPosition > 280) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.text(lines[i], 20, yPosition);
        yPosition += lineHeight;
      }
      
      // Save the PDF
      const filename = `${book.title.replace(/[^a-zA-Z0-9]/g, '_')}_by_${getAuthorDisplay(book.authors).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      pdf.save(filename);
      
      // Show success message
      alert(`✅ Book "${book.title}" downloaded successfully!\n\nFile: ${filename}\nText Length: ${processedText.length.toLocaleString()} characters\nSource: Project Gutenberg\n\nHTML formatting has been applied for better readability!`);
      
    } catch (error) {
      console.error('Error downloading book:', error);
      alert(`❌ Failed to download book: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try another book or check your internet connection.`);
    } finally {
      setIsDownloading(false);
      setSelectedBook(null);
    }
  };

  const convertBookToAudio = async (book: GutenbergBook) => {
    setIsConvertingToAudio(true);
    setSelectedBook(book);

    try {
      // Convert book to audio
      const audioResult = await api.convertGutenbergBookToAudio(book.id);
      
      if (audioResult.status === 'success' && audioResult.audio_url) {
        // Redirect to PDF to Audio page with the audio file
        const audioFileName = `${book.title.replace(/[^a-zA-Z0-9]/g, '_')}_audio.mp3`;
        
        // Store the audio URL in sessionStorage for the PDF to Audio page
        sessionStorage.setItem('gutenberg_audio_url', audioResult.audio_url);
        sessionStorage.setItem('gutenberg_audio_title', book.title);
        sessionStorage.setItem('gutenberg_audio_author', getAuthorDisplay(book.authors));
        sessionStorage.setItem('gutenberg_audio_duration', audioResult.duration?.toString() || '0');
        
        // Show success message and redirect
        alert(`✅ Book "${book.title}" converted to audio successfully!\n\nRedirecting to audio player...`);
        
        // Navigate to PDF to Audio page
        navigate('/pdf-to-audio');
        
      } else {
        throw new Error('Conversion failed or no audio URL received');
      }
      
    } catch (error) {
      console.error('Error converting book to audio:', error);
      alert(`❌ Failed to convert book to audio: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again later.`);
    } finally {
      setIsConvertingToAudio(false);
      setSelectedBook(null);
    }
  };

  const categories = [
    'Fiction', 'Non-Fiction', 'Poetry', 'Drama', 'History', 
    'Philosophy', 'Science', 'Religion', 'Biography', 'Travel',
    'Adventure', 'Romance', 'Mystery', 'Fantasy', 'Children\'s Literature'
  ];

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
            Project Gutenberg Library
          </h1>
          <p className="text-lg text-white/80 mb-4">
            Discover and download thousands of free public domain books
          </p>
          
          {/* Audio Library Button */}

        </div>

        {/* Search Section */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search books by title, author, or subject..."
                  className="w-full px-4 py-3 bg-white/20 text-white placeholder-white/60 rounded-lg border border-white/20 focus:outline-none focus:border-purple-400"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Search className="h-5 w-5" />
                )}
                Search
              </button>
            </div>
          </form>

          {/* Categories */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold">Popular Categories:</h3>
              {selectedCategory && (
                <button
                  onClick={() => {
                    setSelectedCategory('');
                    setSearchResults([]);
                    setSearchError(null);
                  }}
                  className="text-purple-300 hover:text-purple-200 text-sm transition-colors"
                >
                  Clear Filter
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => searchByCategory(category)}
                  disabled={isLoading}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedCategory === category
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/20 text-white hover:bg-white/30 disabled:opacity-50'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            {selectedCategory && (
              <p className="text-white/60 text-sm mt-2">
                Showing results for: <span className="text-purple-300 font-medium">{selectedCategory}</span>
              </p>
            )}
          </div>
        </div>

        {/* Error Message */}
        {searchError && (
          <div className="bg-red-500/20 backdrop-blur-md rounded-lg p-4 mb-6 text-red-200">
            {searchError}
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              Search Results ({searchResults.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((book) => (
                <div
                  key={book.id}
                  className="bg-white/10 backdrop-blur-md rounded-lg p-6 hover:bg-white/20 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {book.cover_url ? (
                      <img
                        src={book.cover_url}
                        alt={book.title}
                        className="w-16 h-20 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-20 bg-purple-600/30 rounded flex items-center justify-center">
                        <Book className="h-8 w-8 text-purple-300" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2">
                        {book.title}
                      </h3>
                      <p className="text-white/80 text-sm mb-2">
                        by {getAuthorDisplay(book.authors)}
                      </p>
                      <div className="flex items-center gap-4 text-white/60 text-xs mb-3">
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {getLanguageDisplay(book.languages)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          {book.download_count.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-white/70 text-xs mb-4 line-clamp-2">
                        {getSubjectsDisplay(book.subjects)}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => downloadBook(book)}
                          disabled={isDownloading && selectedBook?.id === book.id}
                          className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                          {isDownloading && selectedBook?.id === book.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                          {isDownloading && selectedBook?.id === book.id ? 'Downloading...' : 'Download'}
                        </button>
                        <button
                          onClick={() => convertBookToAudio(book)}
                          disabled={isConvertingToAudio && selectedBook?.id === book.id}
                          className="flex-1 px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                          {isConvertingToAudio && selectedBook?.id === book.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Headphones className="h-4 w-4" />
                          )}
                          {isConvertingToAudio && selectedBook?.id === book.id ? 'Converting...' : 'Audio'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Results Message */}
        {selectedCategory && searchResults.length === 0 && !isLoading && !searchError && (
          <div className="text-center text-white/60 mb-8">
            <Book className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No books found for "{selectedCategory}"</p>
            <p className="text-sm">Try a different category or use the search bar above to find specific books.</p>
          </div>
        )}

        {/* Popular Books */}
        {popularBooks.length > 0 && searchResults.length === 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Popular Books
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularBooks.map((book) => (
                <div
                  key={book.id}
                  className="bg-white/10 backdrop-blur-md rounded-lg p-6 hover:bg-white/20 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {book.cover_url ? (
                      <img
                        src={book.cover_url}
                        alt={book.title}
                        className="w-16 h-20 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-20 bg-purple-600/30 rounded flex items-center justify-center">
                        <Book className="h-8 w-8 text-purple-300" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2">
                        {book.title}
                      </h3>
                      <p className="text-white/80 text-sm mb-2">
                        by {getAuthorDisplay(book.authors)}
                      </p>
                      <div className="flex items-center gap-4 text-white/60 text-xs mb-3">
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {getLanguageDisplay(book.languages)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          {book.download_count.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-white/70 text-xs mb-4 line-clamp-2">
                        {getSubjectsDisplay(book.subjects)}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => downloadBook(book)}
                          disabled={isDownloading && selectedBook?.id === book.id}
                          className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                          {isDownloading && selectedBook?.id === book.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                          {isDownloading && selectedBook?.id === book.id ? 'Downloading...' : 'Download'}
                        </button>
                        <button
                          onClick={() => convertBookToAudio(book)}
                          disabled={isConvertingToAudio && selectedBook?.id === book.id}
                          className="flex-1 px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                          {isConvertingToAudio && selectedBook?.id === book.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Headphones className="h-4 w-4" />
                          )}
                          {isConvertingToAudio && selectedBook?.id === book.id ? 'Converting...' : 'Audio'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {!isLoading && searchResults.length === 0 && popularBooks.length === 0 && (
          <div className="text-center text-white/60">
            <Book className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>No books found. Try searching for a different term or browse popular books.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LibraryPage; 