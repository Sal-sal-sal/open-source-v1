import os
import asyncio
import aiofiles
from typing import List, Dict, Optional, Tuple
from pathlib import Path
from datetime import datetime
import uuid
import logging
import subprocess
import tempfile
import json

# Configure logging
logger = logging.getLogger(__name__)

class LocalTTSService:
    """Local Text-to-Speech service using Coqui TTS for offline processing."""
    
    def __init__(self):
        # Output directory
        self.output_dir = Path("uploads/audiobooks")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Voice configuration - Coqui TTS voices
        self.available_voices = [
            "tts_models/en/ljspeech/tacotron2-DDC",
            "tts_models/en/ljspeech/fast_pitch",
            "tts_models/en/vctk/vits",
            "tts_models/multilingual/multi-dataset/your_tts",
            "tts_models/en/ljspeech/glow-tts",
            "tts_models/en/ljspeech/speedy-speech",
        ]
        
        self.voice_names = {
            "tts_models/en/ljspeech/tacotron2-DDC": "LJSpeech (Tacotron2)",
            "tts_models/en/ljspeech/fast_pitch": "LJSpeech (FastPitch)",
            "tts_models/en/vctk/vits": "VCTK (Multi-Speaker)",
            "tts_models/multilingual/multi-dataset/your_tts": "YourTTS (Multilingual)",
            "tts_models/en/ljspeech/glow-tts": "LJSpeech (GlowTTS)",
            "tts_models/en/ljspeech/speedy-speech": "LJSpeech (SpeedySpeech)",
        }
        
        # Default settings
        self.default_voice = "tts_models/en/ljspeech/fast_pitch"
        self.default_speed = 1.0
        
        # Processing limits
        self.max_concurrent_requests = 3  # Local processing is more limited
        self.max_text_length = 1000  # Coqui TTS limit
        self.rate_limit_delay = 0.5  # Delay between local processing
        
    async def create_optimal_chunks(self, text: str, target_size: int = 300) -> List[str]:
        """
        Create optimal text chunks for TTS processing.
        
        Args:
            text: Full text to chunk
            target_size: Target words per chunk
            
        Returns:
            List of text chunks
        """
        # Clean the text first
        cleaned_text = self._clean_text(text)
        
        # Split into sentences
        sentences = self._split_into_sentences(cleaned_text)
        
        chunks = []
        current_chunk = ""
        current_word_count = 0
        
        for sentence in sentences:
            sentence_word_count = len(sentence.split())
            
            # If adding this sentence would exceed target size, start new chunk
            if current_word_count + sentence_word_count > target_size and current_chunk:
                chunks.append(current_chunk.strip())
                current_chunk = sentence
                current_word_count = sentence_word_count
            else:
                current_chunk += " " + sentence if current_chunk else sentence
                current_word_count += sentence_word_count
        
        # Add the last chunk if it has content
        if current_chunk.strip():
            chunks.append(current_chunk.strip())
        
        # Ensure no chunk exceeds Coqui TTS limit
        final_chunks = []
        for chunk in chunks:
            if len(chunk) > self.max_text_length:
                # Split oversized chunks
                sub_chunks = self._split_large_chunk(chunk)
                final_chunks.extend(sub_chunks)
            else:
                final_chunks.append(chunk)
        
        return final_chunks
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text for TTS processing."""
        # Remove extra whitespace
        text = " ".join(text.split())
        
        # Remove special characters that might cause TTS issues
        # Keep punctuation that helps with natural speech
        import re
        text = re.sub(r'[^\w\s\.\,\!\?\;\:\-\(\)]', '', text)
        
        return text.strip()
    
    def _split_into_sentences(self, text: str) -> List[str]:
        """Split text into sentences using natural language processing."""
        import re
        
        # Simple sentence splitting - can be enhanced with NLTK if needed
        sentence_endings = r'(?<=[.!?])\s+'
        sentences = re.split(sentence_endings, text)
        
        # Filter out empty sentences
        sentences = [s.strip() for s in sentences if s.strip()]
        
        return sentences
    
    def _split_large_chunk(self, chunk: str) -> List[str]:
        """Split a chunk that exceeds Coqui TTS text limit."""
        if len(chunk) <= self.max_text_length:
            return [chunk]
        
        # Split by sentences first
        sentences = self._split_into_sentences(chunk)
        
        sub_chunks = []
        current_sub_chunk = ""
        
        for sentence in sentences:
            if len(current_sub_chunk + " " + sentence) <= self.max_text_length:
                current_sub_chunk += " " + sentence if current_sub_chunk else sentence
            else:
                if current_sub_chunk:
                    sub_chunks.append(current_sub_chunk)
                current_sub_chunk = sentence
        
        if current_sub_chunk:
            sub_chunks.append(current_sub_chunk)
        
        return sub_chunks
    
    async def generate_speech(
        self, 
        text: str, 
        voice: str = None, 
        speed: float = None,
        output_filename: str = None
    ) -> str:
        """
        Generate speech from text using Coqui TTS.
        
        Args:
            text: Text to convert to speech
            voice: Voice model to use
            speed: Speech speed (0.25 to 4.0)
            output_filename: Optional output filename
            
        Returns:
            Path to generated audio file
        """
        voice = voice or self.default_voice
        speed = speed or self.default_speed
        
        if voice not in self.available_voices:
            raise ValueError(f"Invalid voice. Available voices: {list(self.voice_names.values())}")
        
        if not 0.25 <= speed <= 4.0:
            raise ValueError("Speed must be between 0.25 and 4.0")
        
        # Generate unique filename if not provided
        if not output_filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_filename = f"tts_{timestamp}_{uuid.uuid4().hex[:8]}.wav"
        
        output_path = self.output_dir / output_filename
        
        try:
            voice_name = self.voice_names.get(voice, voice)
            logger.info(f"Generating speech for {len(text)} characters with voice '{voice_name}'")
            
            # Create temporary text file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8') as temp_file:
                temp_file.write(text)
                temp_text_file = temp_file.name
            
            try:
                # Run Coqui TTS command
                cmd = [
                    "tts",
                    "--text", temp_text_file,
                    "--model_name", voice,
                    "--out_path", str(output_path),
                    "--use_cuda", "false"  # Use CPU for compatibility
                ]
                
                # Run the command
                result = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    timeout=300  # 5 minute timeout
                )
                
                if result.returncode != 0:
                    raise Exception(f"Coqui TTS failed: {result.stderr}")
                
                logger.info(f"Speech generated successfully: {output_path}")
                return str(output_path)
                
            finally:
                # Clean up temporary file
                os.unlink(temp_text_file)
            
        except Exception as e:
            logger.error(f"Error generating speech: {e}")
            raise
    
    async def process_chunks_parallel(
        self, 
        chunks: List[str], 
        voice: str = None, 
        speed: float = None,
        progress_callback: callable = None
    ) -> List[str]:
        """
        Process multiple text chunks in parallel with rate limiting.
        
        Args:
            chunks: List of text chunks to process
            voice: Voice to use for TTS
            speed: Speech speed
            progress_callback: Optional progress callback function
            
        Returns:
            List of paths to generated audio files
        """
        semaphore = asyncio.Semaphore(self.max_concurrent_requests)
        audio_files = []
        
        async def process_chunk(chunk: str, index: int) -> Tuple[int, str]:
            """Process a single chunk with semaphore limiting."""
            async with semaphore:
                try:
                    # Delay for local processing
                    await asyncio.sleep(self.rate_limit_delay)
                    
                    # Generate unique filename for this chunk
                    chunk_filename = f"chunk_{index:04d}_{uuid.uuid4().hex[:8]}.wav"
                    
                    audio_path = await self.generate_speech(
                        text=chunk,
                        voice=voice,
                        speed=speed,
                        output_filename=chunk_filename
                    )
                    
                    logger.info(f"Chunk {index + 1}/{len(chunks)} processed successfully")
                    
                    # Call progress callback if provided
                    if progress_callback:
                        progress = (index + 1) / len(chunks) * 100
                        await progress_callback(progress, index + 1, len(chunks))
                    
                    return index, audio_path
                    
                except Exception as e:
                    logger.error(f"Error processing chunk {index}: {e}")
                    raise
        
        # Create tasks for all chunks
        tasks = [process_chunk(chunk, i) for i, chunk in enumerate(chunks)]
        
        # Process chunks in parallel
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Handle results and maintain order
        for result in results:
            if isinstance(result, Exception):
                raise result
            index, audio_path = result
            audio_files.append(audio_path)
        
        return audio_files
    
    async def convert_text_to_audiobook(
        self, 
        text: str, 
        voice: str = None, 
        speed: float = None,
        chunk_size: int = 300,
        progress_callback: callable = None
    ) -> Dict[str, any]:
        """
        Convert full text to audiobook with chunking and parallel processing.
        
        Args:
            text: Full text to convert
            voice: Voice to use
            speed: Speech speed
            chunk_size: Target words per chunk
            progress_callback: Optional progress callback
            
        Returns:
            Dictionary with audio file path and metadata
        """
        logger.info(f"Starting audiobook conversion for {len(text)} characters")
        
        # Create optimal chunks
        chunks = await self.create_optimal_chunks(text, chunk_size)
        logger.info(f"Created {len(chunks)} chunks for processing")
        
        # Process chunks in parallel
        audio_files = await self.process_chunks_parallel(
            chunks=chunks,
            voice=voice,
            speed=speed,
            progress_callback=progress_callback
        )
        
        # Return metadata
        metadata = {
            "chunks_count": len(chunks),
            "audio_files": audio_files,
            "voice": voice or self.default_voice,
            "voice_name": self.voice_names.get(voice or self.default_voice, "Unknown"),
            "speed": speed or self.default_speed,
            "chunk_size": chunk_size,
            "total_text_length": len(text),
            "created_at": datetime.now().isoformat()
        }
        
        logger.info(f"Audiobook conversion completed: {len(audio_files)} audio files generated")
        return metadata
    
    async def get_available_voices(self) -> List[Dict[str, str]]:
        """Get list of available voices with their details."""
        return [
            {"id": voice_id, "name": name, "description": f"Coqui TTS: {name}"}
            for voice_id, name in self.voice_names.items()
        ] 