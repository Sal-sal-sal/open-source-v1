import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client'; // Assuming you have an api client
import { getGradient } from '../utils/gradients';

const AudioBooksPage: React.FC = () => {
    const [audioFiles, setAudioFiles] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAudioFiles = async () => {
            try {
                const response = await apiClient.get('/api/audio/');
                setAudioFiles(response.data.audio_files);
            } catch (err) {
                setError('Failed to fetch audio files.');
                console.error(err);
            }
        };

        fetchAudioFiles();
    }, []);

    return (
        <div className="relative min-h-screen p-4 overflow-hidden">
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
            <div className="relative z-20">
                <h1 className="text-3xl font-bold mb-6 text-white text-center">Audio Books</h1>
                {error && <p className="text-red-300 text-center mb-4">{error}</p>}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {audioFiles.map((fileId) => (
                        <div key={fileId} className="backdrop-blur-sm bg-white/10 border border-white/20 shadow-lg rounded-lg p-6 hover:bg-white/20 transition-all duration-300">
                            <h2 className="text-lg font-semibold mb-3 text-white">{fileId}</h2>
                            <audio controls className="w-full">
                                <source src={`/api/audio/file/${fileId}`} type="audio/mpeg" />
                                Your browser does not support the audio element.
                            </audio>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AudioBooksPage; 