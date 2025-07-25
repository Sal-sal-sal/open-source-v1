import React, { useState, useEffect } from 'react';
import { Search, Play, Download, Headphones, Clock, Eye, ThumbsUp, User, Calendar, MessageCircle } from 'lucide-react';
import { authFetch } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import { getGradient } from '../utils/gradients';

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  viewCount: string;
  likeCount: string;
  duration: string;
  url: string;
}

interface SearchResult {
  items: Video[];
  nextPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

const VideoPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);

  const searchVideos = async (query: string, pageToken?: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      // YouTube Search API
      const response = await authFetch(`/api/video/search?q=${encodeURIComponent(query)}${pageToken ? `&pageToken=${pageToken}` : ''}`);
      const data: SearchResult = await response.json();
      
      console.log('API Response:', data); // Debug log
      
      if (pageToken) {
        setSearchResults(prev => [...prev, ...(data.items || [])]);
      } else {
        setSearchResults(data.items || []);
      }
      
      setNextPageToken(data.nextPageToken || null);
      setTotalResults(data.pageInfo?.totalResults || 0);
    } catch (error) {
      console.error('Error searching videos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setNextPageToken(null);
    searchVideos(searchQuery);
  };

  const loadMoreResults = () => {
    if (nextPageToken) {
      searchVideos(searchQuery, nextPageToken);
    }
  };

  const formatDuration = (duration: string) => {
    // Convert ISO 8601 duration to readable format
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return duration;
    
    const hours = match[1] ? match[1].replace('H', '') : '0';
    const minutes = match[2] ? match[2].replace('M', '') : '0';
    const seconds = match[3] ? match[3].replace('S', '') : '0';
    
    if (hours !== '0') {
      return `${hours}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.padStart(2, '0')}`;
  };

  const formatViewCount = (count: string) => {
    const num = parseInt(count);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
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
      {/* Видео фон Marie */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{ filter: 'brightness(0.3)' }}
      >
        <source src="/resurses/videomarie.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Затемнение поверх видео */}
      <div className="absolute inset-0 bg-black/40 z-10"></div>
      
      {/* Контент */}
      <div className="relative z-20 max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            <Play className="inline-block mr-3 text-red-400" />
            Video Search & Watch
          </h1>
          <p className="text-lg text-white/80">
            Search YouTube videos and watch them with AI chat
          </p>
        </div>

        {/* Search Section */}
        <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-white">Search Videos</h2>
          
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for videos on YouTube..."
                className="w-full px-4 py-3 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 bg-white/10 text-white placeholder-white/60"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !searchQuery.trim()}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
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

        {/* Search Results */}
        {searchResults && searchResults.length > 0 && (
          <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-lg shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-white">
                Search Results ({totalResults > 0 ? totalResults.toLocaleString() :  searchResults.length} videos found)
              </h2>
              {nextPageToken && (
                <button
                  onClick={loadMoreResults}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-500 transition-colors"
                >
                  {isLoading ? 'Loading...' : 'Load More'}
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((video) => (
                <div key={video.id} className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-lg overflow-hidden hover:shadow-lg hover:bg-white/20 hover:scale-105 hover:shadow-purple-500/50 transition-all duration-300 ease-in-out">
                  <div className="relative">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                      {formatDuration(video.duration)}
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-white mb-2 text-sm" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {video.title}
                    </h3>
                    
                    <div className="flex items-center text-xs text-white/70 mb-2">
                      <User className="mr-1" />
                      {video.channelTitle}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-white/60 mb-3">
                      <span className="flex items-center">
                        <Eye className="mr-1" />
                        {formatViewCount(video.viewCount)}
                      </span>
                      <span className="flex items-center">
                        <ThumbsUp className="mr-1" />
                        {formatViewCount(video.likeCount)}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="mr-1" />
                        {formatDate(video.publishedAt)}
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/video/${video.id}`)}
                        className="w-full px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors text-center"
                      >
                        <MessageCircle className="inline mr-1" />
                        Watch with AI Chat
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}



        {/* Popular Searches Section */}
        <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-white">Popular Searches</h2>
          <p className="text-white/80 mb-4">
            Try searching for popular topics like "tutorial", "music", "news", "educational", 
            "podcast", or "lecture" to get started.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              "Tutorial", "Music", "News", "Educational", "Podcast", "Lecture"
            ].map((topic, index) => (
              <button
                key={index}
                onClick={() => {
                  setSearchQuery(topic);
                  searchVideos(topic);
                }}
                className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-lg p-4 text-center hover:bg-white/20 transition-all duration-300"
              >
                <Play className="mx-auto h-6 w-6 text-red-400 mb-2" />
                <p className="font-semibold text-white text-sm">{topic}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPage; 