import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { FaPlay, FaPause, FaRedo, FaUndo } from 'react-icons/fa';
import { authFetch } from '../utils/auth'; // We will use this to add the token
import { createNote } from '../components/notes/Create_notes';

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

  if (loading) {
    return <div className="p-4">Loading Audio...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (!chatDetails) {
    return <div className="p-4">Audio chat not found.</div>;
  }

  return (
    <div className="p-4 flex flex-col items-center justify-center">
      <h2 className="text-2xl font-bold mb-4">{chatDetails.name}</h2>
      
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

          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg w-3/4 ">
            <div className="flex items-center gap-2 mt-4">
              <span className="text-sm">{formatTime(progress)}</span>
              <input
                ref={timelineRef}
                type="range"
                value={progress}
                max={duration || 0}
                onChange={handleTimelineChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <span className="text-sm">{formatTime(duration)}</span>
            </div>
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => handleRewind(10)} className="text-2xl text-gray-700 dark:text-gray-300 hover:text-blue-500">
                <div className="relative">
                  <FaUndo />
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-white">10</span>
                </div>
              </button>
              <button onClick={handlePlayPause} className="text-4xl bg-blue-500 text-white w-16 h-16 rounded-full flex items-center justify-center">
                {isPlaying ? <FaPause /> : <FaPlay />}
              </button>
              <button onClick={() => handleForward(30)} className="text-2xl text-gray-700 dark:text-gray-300 hover:text-blue-500">
                <div className="relative">
                  <FaRedo />
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-white">30</span>
                </div>
              </button>
            </div>
          </div>
        </>
      )}

      <div className="mt-6 justify-center items-center text-center h-screen">
        <h2 className="text-xl font-semibold self-center ">Create Notes</h2>
        <button className="p-4 mt-2 bg-gray-100 dark:bg-[#15251c] rounded-3xl h-1/2 w-9/10" onClick={() => createNote(chatId, 'test')}>
          <p className="text-gray-100 text-6xl">Click to create notes</p>
        </button>
      </div>
    </div>
  );
};

export default AudioChatView;


{/* <div className="bg-gray-200 dark:bg-slate-800 text-gray-900 flex flex-col  dark:text-white w-full rounded-3xl py-4 pl-6 pr-16 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-lg">
<input
type="text"
placeholder={t('AskSomething') || 'Спроси что-нибудь!'}
value={inputValue}
onChange={(e) => {
  setInputValue(e.target.value);
  setTextis(e.target.value.length > 0);
}}
/>
<img src="https://www.svgrepo.com/show/193043/notes-note.svg" alt="Create Notes" className="w-11 h-11 self-start text-white" />
</div>   better input form */}