import React, { useState, useRef, useCallback } from 'react';
import { FaMicrophone, FaStop, FaPlay, FaTrash } from 'react-icons/fa';
import { authFetch } from '../utils/auth';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob, transcript: string) => void;
  onError: (error: string) => void;
  className?: string;
  preferredService?: 'openai' | 'groq' | 'auto';
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ 
  onRecordingComplete, 
  onError, 
  className = "",
  preferredService = "auto"
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioBlobRef = useRef<Blob | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioBlobRef.current = audioBlob;
        setHasRecording(true);
        
        // Create audio element for playback
        const audioUrl = URL.createObjectURL(audioBlob);
        audioElementRef.current = new Audio(audioUrl);
        audioElementRef.current.onended = () => setIsPlaying(false);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      onError('Failed to start recording. Please check microphone permissions.');
    }
  }, [onError]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const playRecording = useCallback(() => {
    if (audioElementRef.current && hasRecording) {
      if (isPlaying) {
        audioElementRef.current.pause();
        setIsPlaying(false);
      } else {
        audioElementRef.current.play();
        setIsPlaying(true);
      }
    }
  }, [hasRecording, isPlaying]);

  const deleteRecording = useCallback(() => {
    if (audioElementRef.current) {
      URL.revokeObjectURL(audioElementRef.current.src);
      audioElementRef.current = null;
    }
    audioBlobRef.current = null;
    setHasRecording(false);
    setRecordingTime(0);
    setIsPlaying(false);
  }, []);

  const transcribeAndSend = useCallback(async () => {
    if (!audioBlobRef.current) return;
    
    setIsTranscribing(true);
    
    try {
      // Convert webm to mp3 for better compatibility
      const formData = new FormData();
      formData.append('file', audioBlobRef.current, 'recording.webm');
      
      // Add service parameter if specified
      if (preferredService !== 'auto') {
        formData.append('service', preferredService);
      }
      
      const response = await authFetch('/api/audio/transcript/', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Transcription failed: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      const transcript = result.transcript || 'No transcript available';
      
      // Call the callback with audio blob and transcript
      onRecordingComplete(audioBlobRef.current, transcript);
      
      // Clean up
      deleteRecording();
      
    } catch (error) {
      console.error('Error transcribing audio:', error);
      onError('Failed to transcribe audio. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  }, [onRecordingComplete, onError, deleteRecording, preferredService]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`backdrop-blur-sm bg-white/10 border border-white/20 rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-4">Voice Message</h3>
      
      {/* Recording Status */}
      {isRecording && (
        <div className="flex items-center justify-center mb-4">
          <div className="animate-pulse bg-red-500 w-4 h-4 rounded-full mr-2"></div>
          <span className="text-white font-medium">
            Recording... {formatTime(recordingTime)}
          </span>
        </div>
      )}
      
      {/* Recording Controls */}
      <div className="flex items-center justify-center gap-4 mb-4">
        {!isRecording && !hasRecording && (
          <button
            onClick={startRecording}
            className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full transition-colors"
            title="Start Recording"
          >
            <FaMicrophone className="w-6 h-6" />
          </button>
        )}
        
        {isRecording && (
          <button
            onClick={stopRecording}
            className="bg-gray-500 hover:bg-gray-600 text-white p-4 rounded-full transition-colors"
            title="Stop Recording"
          >
            <FaStop className="w-6 h-6" />
          </button>
        )}
        
        {hasRecording && !isRecording && (
          <>
            <button
              onClick={playRecording}
              className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full transition-colors"
              title={isPlaying ? "Pause" : "Play"}
            >
              <FaPlay className={`w-5 h-5 ${isPlaying ? 'hidden' : 'block'}`} />
              <FaStop className={`w-5 h-5 ${isPlaying ? 'block' : 'hidden'}`} />
            </button>
            
            <button
              onClick={deleteRecording}
              className="bg-gray-500 hover:bg-gray-600 text-white p-3 rounded-full transition-colors"
              title="Delete Recording"
            >
              <FaTrash className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
      
      {/* Action Buttons */}
      {hasRecording && !isRecording && (
        <div className="flex justify-center">
          <button
            onClick={transcribeAndSend}
            disabled={isTranscribing}
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            {isTranscribing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Transcribing...
              </>
            ) : (
              'Send Voice Message'
            )}
          </button>
        </div>
      )}
      
      {/* Instructions */}
      {!hasRecording && !isRecording && (
        <p className="text-white/70 text-sm text-center mt-2">
          Click the microphone to start recording your voice message
        </p>
      )}
    </div>
  );
};

export default VoiceRecorder; 