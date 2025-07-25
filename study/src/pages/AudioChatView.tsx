import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { FaPlay, FaPause, FaRedo, FaUndo } from 'react-icons/fa';
import { authFetch } from '../utils/auth'; // We will use this to add the token
import CreateNotesButton from '../components/CreateNotesButton';
import VoiceRecorder from '../components/VoiceRecorder';
import { getGradient } from '../utils/gradients';

interface AudioChatDetails {
  name: string;
  file_id: string;
}

const AudioChatView: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const [chatDetails, setChatDetails] = useState<AudioChatDetails | null>(null);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [voiceMessageError, setVoiceMessageError] = useState<string | null>(null);
  const [voiceMessageSuccess, setVoiceMessageSuccess] = useState<string | null>(null);
  const timelineRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!chatId) return;

    const fetchChatAndAudio = async () => {
      try {
        // First, get the chat details to find the file_id
        const chatResponse = await apiClient.get(`/api/audio-chats/${chatId}`);
        const details = chatResponse.data;
        setChatDetails(details);

        // Then, fetch the audio file using authFetch, which adds the Bearer token
        const audioResponse = await authFetch(`/api/audio/file/${details.file_id}`);
        if (!audioResponse.ok) {
          throw new Error('Could not fetch audio file. Please ensure you are logged in.');
        }
        
        // Create a local URL for the audio blob to use in the <audio> tag
        const audioBlob = await audioResponse.blob();
        const localAudioUrl = URL.createObjectURL(audioBlob);
        setAudioSrc(localAudioUrl);

      } catch (err) {
        setError('Failed to load audio chat session.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchChatAndAudio();

    // Cleanup the blob URL when the component unmounts
    return () => {
        if (audioSrc) {
            URL.revokeObjectURL(audioSrc);
        }
    };
  }, [chatId]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleTimelineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Number(e.target.value);
      setProgress(Number(e.target.value));
    }
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleRewind = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime -= seconds;
    }
  };

  const handleForward = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime += seconds;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleVoiceMessageComplete = async (audioBlob: Blob, transcript: string) => {
    try {
      // Create a FormData with the audio blob
      const formData = new FormData();
      formData.append('file', audioBlob, 'voice_message.webm');
      
      // Upload the voice message
      const uploadResponse = await authFetch('/api/audio/load', {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Upload response error:', uploadResponse.status, errorText);
        throw new Error(`Failed to upload voice message: ${uploadResponse.status} - ${errorText}`);
      }
      
      const uploadResult = await uploadResponse.json();
      const fileId = uploadResult.file_id;
      
      // Create notes from the transcript
      if (chatId) {
        try {
          // Create note from voice message using the new endpoint
          const noteFormData = new FormData();
          noteFormData.append('voice_file', audioBlob, 'voice_message.webm');
          noteFormData.append('note_title', `Голосовая заметка - ${new Date().toLocaleString()}`);
          noteFormData.append('note_content', `Создано из голосового сообщения в чате: ${chatDetails?.name || 'Неизвестно'}\n\nТранскрипция: ${transcript}\n\nПожалуйста, создай структурированную заметку на основе этого голосового сообщения, включая:\n- Основные идеи и концепции\n- Личные ассоциации и связи\n- Практическое применение\n- Важность для обучения`);
          noteFormData.append('tags', 'voice,auto-generated,ai-structured');
          
          const noteResponse = await authFetch('/api/voice-notes/create-from-voice-message/', {
            method: 'POST',
            body: noteFormData,
          });
          
          if (noteResponse.ok) {
            const noteResult = await noteResponse.json();
            setVoiceMessageSuccess(`✅ Voice message processed and note created! Transcript: "${transcript}"`);
            console.log('Note created successfully:', noteResult);
            
            // Also try to create a combined note with the audiobook transcript if available
            if (chatDetails?.file_id) {
              try {
                console.log('Attempting to create combined note with file_id:', chatDetails.file_id);
                const combinedFormData = new FormData();
                combinedFormData.append('voice_file', audioBlob, 'voice_message.webm');
                combinedFormData.append('transcript_file_id', chatDetails.file_id);
                combinedFormData.append('note_title', `Комбинированная заметка - ${new Date().toLocaleString()}`);
                combinedFormData.append('note_content', `Комбинированная заметка из аудиокниги "${chatDetails.name}" и голосового сообщения\n\nГолосовое сообщение: ${transcript}\n\nПожалуйста, создай структурированную заметку, объединяющую:\n- Основные идеи из аудиокниги\n- Личные мысли из голосового сообщения\n- Связи между контентом\n- Практическое применение\n- Важность для обучения`);
                combinedFormData.append('tags', 'voice,audiobook,combined,ai-structured');
                
                const combinedResponse = await authFetch('/api/voice-notes/create-from-voice-and-transcript/', {
                  method: 'POST',
                  body: combinedFormData,
                });
                
                if (combinedResponse.ok) {
                  const combinedResult = await combinedResponse.json();
                  console.log('Combined note created successfully:', combinedResult);
                  setVoiceMessageSuccess(`✅ Voice message processed! Note created + Combined note with audiobook!`);
                } else {
                  const errorText = await combinedResponse.text();
                  console.log('Combined note creation failed:', combinedResponse.status, errorText);
                  setVoiceMessageSuccess(`✅ Voice message processed! Note created! (Combined note failed: ${errorText})`);
                }
              } catch (combinedError) {
                console.log('Combined note creation skipped:', combinedError);
                setVoiceMessageSuccess(`✅ Voice message processed! Note created! (Combined note failed)`);
              }
            }
          } else {
            const errorText = await noteResponse.text();
            console.error('Note creation error:', noteResponse.status, errorText);
            setVoiceMessageSuccess(`Voice message processed! Transcript: "${transcript}" (Note creation failed)`);
          }
        } catch (noteError) {
          console.error('Error creating note:', noteError);
          setVoiceMessageSuccess(`Voice message processed! Transcript: "${transcript}" (Note creation failed)`);
        }
        
        setVoiceMessageError(null);
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setVoiceMessageSuccess(null);
        }, 5000);
      }
      
    } catch (error) {
      console.error('Error processing voice message:', error);
      setVoiceMessageError('Failed to process voice message. Please try again.');
      setVoiceMessageSuccess(null);
    }
  };

  const handleVoiceMessageError = (error: string) => {
    setVoiceMessageError(error);
    setVoiceMessageSuccess(null);
  };

  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
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
        <div className="relative z-20 text-white text-xl">Loading Audio...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
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
        <div className="relative z-20 text-red-300 text-xl">{error}</div>
      </div>
    );
  }

  if (!chatDetails) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
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
        <div className="relative z-20 text-white text-xl">Audio chat not found.</div>
      </div>
    );
  }

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
      <div className="relative z-20 flex flex-col items-center justify-center w-full">
        <h2 className="text-2xl font-bold mb-4 text-white">{chatDetails.name}</h2>
        
        {audioSrc && (
          <>
            <audio 
              ref={audioRef}
              src={audioSrc}
              className="w-full hidden"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
            />

            <div className="backdrop-blur-sm bg-white/10 border border-white/20 p-6 rounded-lg w-3/4 shadow-lg">
              <div className="flex items-center gap-2 mt-4">
                <span className="text-sm text-white">{formatTime(progress)}</span>
                <input
                  ref={timelineRef}
                  type="range"
                  value={progress}
                  max={duration || 0}
                  onChange={handleTimelineChange}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-sm text-white">{formatTime(duration)}</span>
              </div>
              <div className="flex items-center justify-center gap-4 mt-4">
                <button onClick={() => handleRewind(10)} className="text-2xl text-white hover:text-blue-300 transition-colors">
                  <div className="relative">
                    <FaUndo />
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-white">10</span>
                  </div>
                </button>
                <button onClick={handlePlayPause} className="text-4xl bg-blue-500 text-white w-16 h-16 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                  {isPlaying ? <FaPause /> : <FaPlay />}
                </button>
                <button onClick={() => handleForward(30)} className="text-2xl text-white hover:text-blue-300 transition-colors">
                  <div className="relative">
                    <FaRedo />
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-white">30</span>
                  </div>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Voice Message Section */}
        <div className="mt-8 w-full max-w-md">
          <VoiceRecorder
            onRecordingComplete={handleVoiceMessageComplete}
            onError={handleVoiceMessageError}
            className="w-full"
          />
          
          {/* Error and Success Messages */}
          {voiceMessageError && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-300 rounded-lg">
              <p className="text-red-300 text-sm">{voiceMessageError}</p>
            </div>
          )}
          
          {voiceMessageSuccess && (
            <div className="mt-4 p-3 bg-green-500/20 border border-green-300 rounded-lg">
              <p className="text-green-300 text-sm">{voiceMessageSuccess}</p>
            </div>
          )}
        </div>  
      </div>
    </div>
  );
};

export default AudioChatView;