import React, { useState, useEffect } from 'react';
import { Search, Play, Pause, Download, Volume2, VolumeX, Clock, User, Calendar, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AudioBook {
  identifier: string;
  title: string;
  creator: string[] | string;
  description: string;
  downloads?: number;
  date?: string;
  runtime?: string;
  language?: string[] | string;
  subject?: string[] | string;
  cover_url?: string;
  archive_url?: string;
  audio_files?: AudioFile[];
}

interface AudioFile {
  name: string;
  title: string;
  format: string;
  size: string;
  length: string;
  download_url: string;
}

interface SearchResult {
  books: AudioBook[];
  total: number;
  offset: number;
  limit: number;
}

const AudioLibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AudioBook[]>([]);
  const [popularBooks, setPopularBooks] = useState<AudioBook[]>([]);
  const [selectedBook, setSelectedBook] = useState<AudioBook | null>(null);
  const [bookDetails, setBookDetails] = useState<AudioBook | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<AudioFile | null>(null);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Load popular books on component mount
  useEffect(() => {
    loadPopularBooks();
  }, []);

  const loadPopularBooks = async () => {
    try {
      console.log('Loading popular books from backend...');
      const response = await fetch('/api/librivox/popular?limit=8');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const books: AudioBook[] = await response.json();
      console.log('Popular books loaded:', books);
      setPopularBooks(books);
    } catch (error) {
      console.error('Error loading popular books:', error);
      setSearchError('Failed to load popular books. Please try again later.');
    }
  };

  const searchAudioBooks = async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    setSearchError(null);
    try {
      console.log('Searching for:', query);
      
      const searchParams = new URLSearchParams({ q: query, limit: '20' });
      const response = await fetch(`/api/librivox/search?${searchParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: SearchResult = await response.json();
      console.log('Search results:', data);
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

  const loadBookDetails = async (book: AudioBook) => {
    try {
      console.log('Loading book details for:', book.identifier);
      const response = await fetch(`/api/librivox/book/${book.identifier}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const details: AudioBook = await response.json();
      console.log('Book details loaded:', details);
      setBookDetails(details);
      setSelectedBook(book);
    } catch (error) {
      console.error('Error loading book details:', error);
      setSearchError('Failed to load book details. Please try again later.');
    }
  };

  const playAudio = (audioFile: AudioFile) => {
    // Stop current audio if playing
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.removeEventListener('loadedmetadata', () => {});
      currentAudio.removeEventListener('timeupdate', () => {});
      currentAudio.removeEventListener('ended', () => {});
    }

    // Stream audio through our backend
    const streamUrl = `/api/librivox/stream/${bookDetails?.identifier}/${audioFile.name}`;
    const audio = new Audio(streamUrl);
    
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTrack(null);
    });

    audio.volume = volume;
    setCurrentAudio(audio);
    setCurrentTrack(audioFile);
    
    audio.play().then(() => {
      setIsPlaying(true);
    }).catch(error => {
      console.error('Error playing audio:', error);
      setSearchError('Failed to play audio. Please try again.');
    });
  };

  const togglePlayPause = () => {
    if (currentAudio) {
      if (isPlaying) {
        currentAudio.pause();
        setIsPlaying(false);
      } else {
        currentAudio.play().then(() => {
          setIsPlaying(true);
        }).catch(error => {
          console.error('Error playing audio:', error);
        });
      }
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (currentAudio) {
      currentAudio.volume = newVolume;
    }
  };

  const handleSeek = (newTime: number) => {
    if (currentAudio) {
      currentAudio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const downloadAudio = (audioFile: AudioFile) => {
    const downloadUrl = `/api/librivox/download/${bookDetails?.identifier}/${audioFile.name}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = audioFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatCreator = (creator: string | string[]) => {
    if (Array.isArray(creator)) {
      return creator.join(', ');
    }
    return creator || 'Unknown';
  };

  const formatSubjects = (subjects: string | string[]) => {
    if (Array.isArray(subjects)) {
      return subjects.slice(0, 3).join(', ');
    }
    return subjects || '';
  };

  const renderBookCard = (book: AudioBook) => (
    <div
      key={book.identifier}
      className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg overflow-hidden shadow-lg hover:bg-white/15 transition-all duration-300 cursor-pointer"
      onClick={() => loadBookDetails(book)}
    >
      <div className="aspect-[3/4] bg-gray-700 flex items-center justify-center overflow-hidden">
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="text-white/60 text-center p-4">
            <Volume2 className="h-12 w-12 mx-auto mb-2" />
            <p className="text-sm">Audio Book</p>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2">
          {book.title}
        </h3>
        <p className="text-white/70 text-xs mb-2 flex items-center">
          <User className="h-3 w-3 mr-1" />
          {formatCreator(book.creator)}
        </p>
        {book.runtime && (
          <p className="text-white/60 text-xs mb-2 flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {book.runtime}
          </p>
        )}
        {book.downloads && (
          <p className="text-white/60 text-xs">
            {book.downloads.toLocaleString()} downloads
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen p-4 flex flex-col items-center justify-center overflow-hidden">
      {/* Видео фон */}
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
      <div className="relative z-20 w-full max-w-7xl mx-auto">
        {/* Заголовок и поиск */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Audio Library
          </h1>
          <p className="text-white/80 text-lg mb-6">
            Discover thousands of free audiobooks from LibriVox
          </p>

          {/* Форма поиска */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-6">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, author, or subject..."
                className="w-full px-6 py-4 pr-14 text-lg rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-3 text-white hover:text-blue-400 transition-colors disabled:opacity-50"
              >
                <Search className="h-6 w-6" />
              </button>
            </div>
          </form>

          {/* Статус поиска */}
          {isLoading && (
            <p className="text-blue-400 mb-4">Searching audiobooks...</p>
          )}
          {searchError && (
            <p className="text-red-400 mb-4">{searchError}</p>
          )}
        </div>

        {/* Результаты поиска */}
        {searchResults.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Search Results</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {searchResults.map(renderBookCard)}
            </div>
          </div>
        )}

        {/* Популярные книги */}
        {popularBooks.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Popular Audiobooks</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {popularBooks.map(renderBookCard)}
            </div>
          </div>
        )}

        {/* Детали книги */}
        {selectedBook && bookDetails && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Заголовок модального окна */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-2">{bookDetails.title}</h2>
                    <p className="text-white/80 flex items-center mb-2">
                      <User className="h-4 w-4 mr-2" />
                      {formatCreator(bookDetails.creator)}
                    </p>
                    {bookDetails.date && (
                      <p className="text-white/60 flex items-center mb-2">
                        <Calendar className="h-4 w-4 mr-2" />
                        {bookDetails.date}
                      </p>
                    )}
                    {bookDetails.subject && (
                      <p className="text-white/60 flex items-center">
                        <Tag className="h-4 w-4 mr-2" />
                        {formatSubjects(bookDetails.subject)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedBook(null);
                      setBookDetails(null);
                      if (currentAudio) {
                        currentAudio.pause();
                        setIsPlaying(false);
                        setCurrentTrack(null);
                      }
                    }}
                    className="text-white/60 hover:text-white text-2xl"
                  >
                    ×
                  </button>
                </div>

                {/* Описание */}
                {bookDetails.description && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                    <p className="text-white/80 text-sm line-clamp-3">{bookDetails.description}</p>
                  </div>
                )}

                {/* Аудио плеер */}
                {currentTrack && (
                  <div className="bg-white/5 rounded-lg p-4 mb-6">
                    <h3 className="text-white font-semibold mb-2">Now Playing</h3>
                    <p className="text-white/80 text-sm mb-3">{currentTrack.title}</p>
                    
                    {/* Контролы плеера */}
                    <div className="flex items-center gap-4 mb-3">
                      <button
                        onClick={togglePlayPause}
                        className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full text-white transition-colors"
                      >
                        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                      </button>
                      
                      {/* Прогресс */}
                      <div className="flex-1">
                        <input
                          type="range"
                          min="0"
                          max={duration}
                          value={currentTime}
                          onChange={(e) => handleSeek(Number(e.target.value))}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-white/60 mt-1">
                          <span>{formatTime(currentTime)}</span>
                          <span>{formatTime(duration)}</span>
                        </div>
                      </div>

                      {/* Громкость */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleVolumeChange(volume > 0 ? 0 : 1)}
                          className="text-white/60 hover:text-white"
                        >
                          {volume > 0 ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={volume}
                          onChange={(e) => handleVolumeChange(Number(e.target.value))}
                          className="w-20"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Список аудиофайлов */}
                {bookDetails.audio_files && bookDetails.audio_files.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Audio Files</h3>
                    <div className="space-y-2">
                      {bookDetails.audio_files.map((audioFile, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="text-white font-medium text-sm">{audioFile.title}</p>
                            <p className="text-white/60 text-xs">
                              {audioFile.format} • {audioFile.size} • {audioFile.length}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => playAudio(audioFile)}
                              className="p-2 bg-green-600 hover:bg-green-700 rounded-full text-white transition-colors"
                              title="Play"
                            >
                              <Play className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => downloadAudio(audioFile)}
                              className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full text-white transition-colors"
                              title="Download"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioLibraryPage; 