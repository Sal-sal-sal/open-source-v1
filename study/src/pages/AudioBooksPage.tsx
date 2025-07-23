import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client'; // Assuming you have an api client

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
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Audio Books</h1>
            {error && <p className="text-red-500">{error}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {audioFiles.map((fileId) => (
                    <div key={fileId} className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4">
                        <h2 className="text-lg font-semibold mb-2">{fileId}</h2>
                        <audio controls className="w-full">
                            <source src={`/api/audio/file/${fileId}`} type="audio/mpeg" />
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AudioBooksPage; 