import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Headphones, Download, Trash2, Play, Pause } from 'lucide-react';
import { authFetch } from '../utils/auth';
import { getGradient } from '../utils/gradients';

interface Voice {
  id: string;
  name: string;
  description: string;
}

interface ConversionResult {
  success: boolean;
  public_url?: string;
  gcs_filename?: string;
  text_length?: number;
  audio_size_bytes?: number;
  voice?: string;
  voice_name?: string;
  processing_time_seconds?: number;
  chunks_processed?: number;
  parallel_processing?: boolean;
  error?: string;
}

const PdfToAudioPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('en-US-Standard-A');
  const [speed, setSpeed] = useState(1.0);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Load voices on component mount
  React.useEffect(() => {
    loadVoices();
  }, []);

  const loadVoices = async () => {
    try {
      const response = await authFetch('/api/pdf-to-audio/voices');
      const data = await response.json();
      setVoices(data.voices);
    } catch (error) {
      console.error('Failed to load voices:', error);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setConversionResult(null);
      } else {
        alert('Please select a PDF file');
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false
  });

  const handleConvert = async () => {
    if (!file) {
      alert('Please select a PDF file first');
      return;
    }

    setIsConverting(true);
    setConversionResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('voice', selectedVoice);
      formData.append('speed', speed.toString());

      const response = await authFetch('/api/pdf-to-audio/convert', {
        method: 'POST',
        body: formData,
      });

      const result: ConversionResult = await response.json();
      setConversionResult(result);

      if (result.success && result.public_url) {
        // Check if it's a local file URL (file://) or remote URL
        if (result.public_url.startsWith('file://')) {
          // For local files, we can't play them directly in browser
          // Just set the URL for download purposes
          setAudioElement(null);
          console.log('Local file saved:', result.public_url);
        } else {
          // For remote URLs (GCS), create audio element for playback
          const audio = new Audio(result.public_url);
          setAudioElement(audio);
        }
      }
    } catch (error) {
      console.error('Conversion failed:', error);
      setConversionResult({
        success: false,
        error: 'Conversion failed. Please try again.'
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handlePlayPause = () => {
    if (!audioElement) return;

    if (isPlaying) {
      audioElement.pause();
      setIsPlaying(false);
    } else {
      audioElement.play();
      setIsPlaying(true);
    }
  };

  const handleDownload = () => {
    if (conversionResult?.public_url) {
      if (conversionResult.public_url.startsWith('file://')) {
        // For local files, show a message since we can't download directly
        alert('File is saved locally. Please check the uploads/audiobooks/ directory on the server.');
      } else {
        // For remote files, create download link
        const link = document.createElement('a');
        link.href = conversionResult.public_url;
        link.download = `audiobook_${Date.now()}.mp3`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
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
      {/* Фоновое изображение PDF to Voice */}
      <img
        src="/resurses/pdf-voice.png"
        alt="PDF to Voice Background"
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{ filter: 'brightness(0.3)' }}
      />
      
      {/* Затемнение поверх изображения */}
      <div className="absolute inset-0 bg-black/40 z-10"></div>
      
      {/* Контент */}
      <div className="relative z-20 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            <Headphones className="inline-block mr-3 text-blue-400" />
            PDF to Audio Converter
          </h1>
          <p className="text-lg text-white/80">
            Convert your PDF documents to high-quality audio files with Google Cloud TTS
          </p>
        </div>

        <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-white">Upload PDF</h2>
          
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-400 bg-blue-500/20'
                : 'border-white/30 hover:border-blue-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-white/60 mb-4" />
            {isDragActive ? (
              <p className="text-blue-300">Drop the PDF here...</p>
            ) : (
              <div>
                <p className="text-white/80 mb-2">
                  Drag & drop a PDF file here, or click to select
                </p>
                <p className="text-sm text-white/60">
                  Only PDF files are supported
                </p>
              </div>
            )}
          </div>

          {file && (
            <div className="mt-4 p-4 bg-green-500/20 border border-green-300/30 rounded-lg">
              <p className="text-green-200">
                <strong>Selected file:</strong> {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            </div>
          )}
        </div>

        <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-white">Conversion Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Voice
              </label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full px-3 py-2 border border-white/30 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/10 text-white placeholder-white/60"
                disabled={isConverting}
              >
                {voices.map((voice) => (
                  <option key={voice.id} value={voice.id}>
                    {voice.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Speed: {speed}x
              </label>
              <input
                type="range"
                min="0.25"
                max="4.0"
                step="0.25"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                disabled={isConverting}
              />
              <div className="flex justify-between text-xs text-white/60 mt-1">
                <span>0.25x</span>
                <span>1.0x</span>
                <span>4.0x</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleConvert}
            disabled={!file || isConverting}
            className={`w-full mt-6 py-3 px-6 rounded-lg font-semibold transition-colors ${
              !file || isConverting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isConverting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Converting...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Headphones className="mr-2" />
                Convert to Audio
              </div>
            )}
          </button>
        </div>

        {conversionResult && (
          <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-white">Conversion Result</h2>
            
            {conversionResult.success ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-500/20 border border-green-300/30 rounded-lg">
                    <p className="text-sm text-green-300 font-medium">Status</p>
                    <p className="text-green-200 font-semibold">✅ Success</p>
                  </div>
                  
                  <div className="p-4 bg-blue-500/20 border border-blue-300/30 rounded-lg">
                    <p className="text-sm text-blue-300 font-medium">Processing Time</p>
                    <p className="text-blue-200 font-semibold">
                      {conversionResult.processing_time_seconds?.toFixed(2)}s
                    </p>
                  </div>
                  
                  <div className="p-4 bg-purple-500/20 border border-purple-300/30 rounded-lg">
                    <p className="text-sm text-purple-300 font-medium">Text Length</p>
                    <p className="text-purple-200 font-semibold">
                      {conversionResult.text_length?.toLocaleString()} characters
                    </p>
                  </div>
                  
                  <div className="p-4 bg-orange-500/20 border border-orange-300/30 rounded-lg">
                    <p className="text-sm text-orange-300 font-medium">Audio Size</p>
                    <p className="text-orange-200 font-semibold">
                      {conversionResult.audio_size_bytes ? formatFileSize(conversionResult.audio_size_bytes) : 'N/A'}
                    </p>
                  </div>
                  
                  {conversionResult.parallel_processing && (
                    <div className="p-4 bg-purple-500/20 border border-purple-300/30 rounded-lg">
                      <p className="text-sm text-purple-300 font-medium">Parallel Processing</p>
                      <p className="text-purple-200 font-semibold">
                        ⚡ {conversionResult.chunks_processed} chunks processed
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-gray-500/20 border border-gray-300/30 rounded-lg">
                  <p className="text-sm text-gray-300 font-medium">Voice Used</p>
                  <p className="text-gray-200 font-semibold">{conversionResult.voice_name}</p>
                </div>

                {conversionResult.public_url?.startsWith('file://') && (
                  <div className="p-4 bg-yellow-500/20 border border-yellow-300/30 rounded-lg">
                    <p className="text-sm text-yellow-300 font-medium">⚠️ Local Storage Mode</p>
                    <p className="text-yellow-200 text-sm">
                      File saved locally due to GCS configuration. To enable cloud storage and direct playback, 
                      please configure Google Cloud Storage bucket permissions as described in GOOGLE_CLOUD_SETUP.md
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  {conversionResult.public_url?.startsWith('file://') ? (
                    // For local files, show info instead of play button
                    <div className="flex items-center px-4 py-2 bg-yellow-500/20 border border-yellow-300/30 text-yellow-200 rounded-lg">
                      <Headphones className="mr-2" />
                      File saved locally (use Download button)
                    </div>
                  ) : (
                    // For remote files, show play button
                    <button
                      onClick={handlePlayPause}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      {isPlaying ? <Pause className="mr-2" /> : <Play className="mr-2" />}
                      {isPlaying ? 'Pause' : 'Play'}
                    </button>
                  )}
                  
                  <button
                    onClick={handleDownload}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="mr-2" />
                    Download MP3
                  </button>
                  
                  {!conversionResult.public_url?.startsWith('file://') && (
                    <a
                      href={conversionResult.public_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Headphones className="mr-2" />
                      Open in New Tab
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-red-500/20 border border-red-300/30 rounded-lg">
                <p className="text-red-200 font-semibold">❌ Conversion Failed</p>
                <p className="text-red-300 mt-2">{conversionResult.error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfToAudioPage; 