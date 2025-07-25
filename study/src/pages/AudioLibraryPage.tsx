import React, { useState, useEffect } from 'react';
import { Search, Headphones, Download, Play, Pause, Volume2, Clock, BookOpen, Globe, Book } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AudioBook {
  id: number;
  title: string;
  description: string;
  language: string;
  copyright_year: number;
  num_sections: number;
  totaltime: string;
  totaltimesecs: number;
  authors: Author[];
  sections: Section[];
}

interface Author {
  id: number;
  first_name: string;
  last_name: string;
}

interface Section {
  id: number;
  section_number: number;
  title: string;
  playtime: string;
  playtime_secs: number;
  download_url: string;
  download_size: number;
}

interface SearchResult {
  books: AudioBook[];
}

const AudioLibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AudioBook[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [proxyStatus, setProxyStatus] = useState<string>('');
  const [selectedBook, setSelectedBook] = useState<AudioBook | null>(null);
  const [currentSection, setCurrentSection] = useState<Section | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Load default search results instead of popular books
    searchAudioBooks('sal');
  }, []);

  const searchAudioBooks = async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    setSearchError(null);
    setProxyStatus('');
    try {
      console.log('Searching for:', query);
      
      // Try local Vite proxy first, then CORS proxies
      const proxyOptions = [
        { type: 'local', url: `/librivox-api/feed/audiobooks/?q=${encodeURIComponent(query)}&format=json&limit=20` },
        { type: 'cors', url: 'https://api.allorigins.win/raw?url=' },
        { type: 'cors', url: 'https://thingproxy.freeboard.io/fetch/' },
        { type: 'cors', url: 'https://corsproxy.io/?' },
        { type: 'cors', url: 'https://api.codetabs.com/v1/proxy?quest=' }
      ];
      
      let response;
      let responseText = '';
      let proxyIndex = 0;
      
      for (const proxy of proxyOptions) {
        try {
          setProxyStatus(`Using ${proxy.type} proxy ${proxyIndex + 1}`);
          let requestUrl;
          
          if (proxy.type === 'local') {
            requestUrl = proxy.url;
            console.log(`Trying local proxy URL:`, requestUrl);
          } else {
            const libriVoxUrl = `https://librivox.org/api/feed/audiobooks/?q=${encodeURIComponent(query)}&format=json&limit=20`;
            requestUrl = proxy.url + encodeURIComponent(libriVoxUrl);
            console.log(`Trying CORS proxy ${proxyIndex} URL:`, requestUrl);
          }
          
          response = await fetch(requestUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Cache-Control': 'no-cache'
            }
          });
          console.log(`${proxy.type} proxy response status:`, response.status);
          
          if (response.ok) {
            responseText = await response.text();
            console.log(`${proxy.type} proxy response text (first 200 chars):`, responseText.substring(0, 200));
            break; // Success, exit the loop
          }
        } catch (error) {
          console.log(`${proxy.type} proxy failed:`, error);
        }
        proxyIndex++;
      }
      
      if (!response || !response.ok) {
        throw new Error(`All proxies failed. Last status: ${response?.status}`);
      }
      
      console.log('Full search response text length:', responseText.length);
      const data: SearchResult = JSON.parse(responseText);
      console.log('Search results data:', data);
      setSearchResults(data.books || []);
    } catch (error) {
      console.error('Error searching audiobooks:', error);
      setSearchError('Failed to search audiobooks. Please try again later.');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchAudioBooks(searchQuery);
  };

  const getAuthorDisplay = (authors: Author[]) => {
    if (!authors || authors.length === 0) return 'Unknown Author';
    return authors.map(author => `${author.first_name} ${author.last_name}`).join(', ');
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const playAudio = (section: Section) => {
    if (audioElement) {
      audioElement.pause();
    }

    const newAudio = new Audio(section.download_url);
    newAudio.addEventListener('loadedmetadata', () => {
      setAudioDuration(newAudio.duration);
    });

    newAudio.addEventListener('timeupdate', () => {
      setAudioProgress(newAudio.currentTime);
    });

    newAudio.addEventListener('ended', () => {
      setIsPlaying(false);
      setAudioProgress(0);
    });

    newAudio.play();
    setAudioElement(newAudio);
    setCurrentSection(section);
    setIsPlaying(true);
  };

  const pauseAudio = () => {
    if (audioElement) {
      audioElement.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioElement) {
      audioElement.currentTime = time;
      setAudioProgress(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    if (audioElement) {
      audioElement.volume = volume;
    }
  };

  const downloadAudio = (section: Section) => {
    const link = document.createElement('a');
    link.href = section.download_url;
    link.download = `${section.title}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative min-h-screen p-6 overflow-hidden">
      {/* Видео фон Audio Library */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{ filter: 'brightness(0.3)' }}
      >
        <source src="/resurses/audiobook.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Затемнение поверх видео */}
      <div className="absolute inset-0 bg-black/40 z-10"></div>
      
      {/* Контент */}
      <div className="relative z-20 max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            <Headphones className="inline-block mr-3 text-purple-400" />
            Audio Library
          </h1>
          <p className="text-lg text-white/80 mb-4">
            Discover and listen to free audiobooks from LibriVox
          </p>
          
          {/* Library Button */}
          <button
            onClick={() => navigate('/library')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Book className="h-5 w-5" />
            Switch to Text Library
          </button>
        </div>

        {/* Search Section */}
        <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-white">Search Audiobooks</h2>
          
          {proxyStatus && (
            <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
              <p className="text-blue-300 text-sm">
                <span className="font-medium">Status:</span> {proxyStatus}
              </p>
            </div>
          )}
          
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for audiobooks by title, author, or subject..."
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
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Searching...
                </div>
              ) : (
                <div className="flex items-center">
                  <Search className="mr-2" />
                  Search
                </div>
              )}
            </button>
          </form>
        </div>

        {/* Audio Player */}
        {currentSection && (
          <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-white">Now Playing</h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <button
                    onClick={isPlaying ? pauseAudio : () => playAudio(currentSection)}
                    className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center hover:bg-purple-700 transition-colors"
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  </button>
                </div>
                
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-lg">{currentSection.title}</h3>
                  <p className="text-white/80 text-sm">
                    {selectedBook?.title} • {getAuthorDisplay(selectedBook?.authors || [])}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Volume2 className="text-white/60" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    defaultValue="1"
                    onChange={handleVolumeChange}
                    className="w-20"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-white/60">
                  <span>{Math.floor(audioProgress / 60)}:{(audioProgress % 60).toFixed(0).padStart(2, '0')}</span>
                  <span>{Math.floor(audioDuration / 60)}:{(audioDuration % 60).toFixed(0).padStart(2, '0')}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={audioDuration}
                  value={audioProgress}
                  onChange={handleSeek}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchError && (
          <div className="backdrop-blur-sm bg-red-500/20 border border-red-500/30 rounded-lg shadow-lg p-6 mb-6">
            <div className="text-center">
              <p className="text-red-300 font-medium">{searchError}</p>
              <p className="text-red-200 text-sm mt-2">
                The LibriVox API might be temporarily unavailable. Please try again later.
              </p>
            </div>
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-white">
              {searchQuery ? `Search Results (${searchResults.length} audiobooks found)` : `Featured Audiobooks (${searchResults.length} found)`}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((book) => (
                <div key={book.id} className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-lg p-4 hover:shadow-md hover:scale-105 hover:shadow-purple-500/50 transition-all duration-300 ease-in-out">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1 line-clamp-2">
                          {book.title}
                        </h3>
                        <p className="text-sm text-white/80 mb-2">
                          by {getAuthorDisplay(book.authors)}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedBook(book)}
                        className="text-purple-400 hover:text-purple-300 text-sm"
                      >
                        View Chapters
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-white/60">
                      <span className="flex items-center">
                        <Clock className="mr-1" />
                        {formatDuration(book.totaltimesecs)}
                      </span>
                      <span className="flex items-center">
                        <BookOpen className="mr-1" />
                        {book.num_sections} chapters
                      </span>
                      <span className="flex items-center">
                        <Globe className="mr-1" />
                        {book.language}
                      </span>
                    </div>
                    
                    {book.description && (
                      <p className="text-sm text-white/70 line-clamp-3">
                        {book.description.replace(/<[^>]*>/g, '')}
                      </p>
                    )}
                    
                    {selectedBook?.id === book.id && book.sections && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-white">Chapters:</h4>
                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {book.sections.slice(0, 5).map((section) => (
                            <div key={section.id} className="flex items-center justify-between text-xs">
                              <span className="text-white/80 truncate flex-1">
                                {section.title}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => playAudio(section)}
                                  className="p-1 text-purple-400 hover:text-purple-300"
                                  title="Play"
                                >
                                  <Play className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => downloadAudio(section)}
                                  className="p-1 text-blue-400 hover:text-blue-300"
                                  title="Download"
                                >
                                  <Download className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                          {book.sections.length > 5 && (
                            <p className="text-xs text-white/60 text-center">
                              +{book.sections.length - 5} more chapters
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioLibraryPage; 