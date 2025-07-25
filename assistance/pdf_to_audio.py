import os
import uuid
import tempfile
import asyncio
import concurrent.futures
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv
import fitz  # PyMuPDF
from google.cloud import texttospeech
from google.cloud import storage
from pydub import AudioSegment
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Import GCS configuration
from core.gcs_config import gcs_config

class PDFToAudioConverter:
    """Complete PDF to audio conversion with GCS upload."""
    
    def __init__(self):
        # GCS Configuration
        self.bucket_name = gcs_config.get_bucket_name()
        
        # Check if GCS is configured
        if not gcs_config.is_configured():
            logger.warning("Google Cloud Storage not configured. GCS upload will be disabled.")
            self.gcs_client = None
            self.bucket = None
        else:
            try:
                self.gcs_client = storage.Client()
                self.bucket = self.gcs_client.bucket(self.bucket_name)
                logger.info(f"GCS client initialized with bucket: {self.bucket_name}")
            except Exception as e:
                logger.error(f"Failed to initialize GCS client: {e}")
                self.gcs_client = None
                self.bucket = None
        
        # TTS Configuration
        self.tts_client = texttospeech.TextToSpeechClient()
        
        # Available voices
        self.available_voices = [
            "en-US-Standard-A",  # Female
            "en-US-Standard-B",  # Male
            "en-US-Standard-C",  # Female
            "en-US-Standard-D",  # Male
            "en-US-Standard-E",  # Female
            "en-US-Standard-F",  # Female
            "en-US-Standard-G",  # Male
            "en-US-Standard-H",  # Female
            "en-US-Standard-I",  # Male
            "en-US-Standard-J",  # Male
        ]
        
        self.voice_names = {
            "en-US-Standard-A": "Google US Female A",
            "en-US-Standard-B": "Google US Male B", 
            "en-US-Standard-C": "Google US Female C",
            "en-US-Standard-D": "Google US Male D",
            "en-US-Standard-E": "Google US Female E",
            "en-US-Standard-F": "Google US Female F",
            "en-US-Standard-G": "Google US Male G",
            "en-US-Standard-H": "Google US Female H",
            "en-US-Standard-I": "Google US Male I",
            "en-US-Standard-J": "Google US Male J",
        }
        
        # Default settings
        self.default_voice = "en-US-Standard-A"
        self.default_speed = 1.0
        
        # Text processing limits
        self.max_text_length = 20000  # Increased limit for longer documents
        self.chunk_size = 4000  # Characters per chunk for parallel processing
        self.max_parallel_requests = 3  # Maximum concurrent TTS requests
        
    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """
        Extract text from PDF using PyMuPDF (fitz).
        
        Args:
            pdf_path: Path to PDF file
            
        Returns:
            Extracted text as string
        """
        try:
            logger.info(f"Extracting text from PDF: {pdf_path}")
            doc = fitz.open(pdf_path)
            
            text_parts = []
            for page_num, page in enumerate(doc):
                page_text = page.get_text()
                if page_text.strip():
                    text_parts.append(page_text)
                logger.info(f"Processed page {page_num + 1}/{len(doc)}")
            
            full_text = "\n".join(text_parts)
            logger.info(f"Extracted {len(full_text)} characters from PDF")
            
            doc.close()
            return full_text
            
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            raise
    
    def clean_text(self, text: str) -> str:
        """
        Clean and normalize text for TTS processing.
        
        Args:
            text: Raw text from PDF
            
        Returns:
            Cleaned text
        """
        import re
        
        # Remove extra whitespace
        text = " ".join(text.split())
        
        # Remove special characters that might cause TTS issues
        # Keep punctuation that helps with natural speech
        text = re.sub(r'[^\w\s\.\,\!\?\;\:\-\(\)]', '', text)
        
        # Limit text length if needed
        if len(text) > self.max_text_length:
            logger.warning(f"Text too long ({len(text)} chars), truncating to {self.max_text_length}")
            text = text[:self.max_text_length]
        
        return text.strip()
    
    def split_text_into_chunks(self, text: str) -> list:
        """
        Split text into chunks for parallel processing.
        
        Args:
            text: Text to split
            
        Returns:
            List of text chunks
        """
        if len(text) <= self.chunk_size:
            return [text]
        
        chunks = []
        current_chunk = ""
        sentences = text.split('. ')
        
        for sentence in sentences:
            # Add period back if it's not the last sentence
            if sentence != sentences[-1]:
                sentence += '. '
            
            # If adding this sentence would exceed chunk size, start new chunk
            if len(current_chunk) + len(sentence) > self.chunk_size and current_chunk:
                chunks.append(current_chunk.strip())
                current_chunk = sentence
            else:
                current_chunk += sentence
        
        # Add the last chunk
        if current_chunk.strip():
            chunks.append(current_chunk.strip())
        
        logger.info(f"Split text into {len(chunks)} chunks for parallel processing")
        return chunks
    
    def process_text_chunk(self, chunk: str, voice: str, speed: float, chunk_index: int) -> tuple:
        """
        Process a single text chunk to audio.
        
        Args:
            chunk: Text chunk to process
            voice: Voice to use
            speed: Speech speed
            chunk_index: Index of the chunk for logging
            
        Returns:
            Tuple of (chunk_index, audio_content, success, error)
        """
        try:
            logger.info(f"Processing chunk {chunk_index + 1}: {len(chunk)} characters")
            audio_content = self.text_to_speech(chunk, voice, speed)
            return (chunk_index, audio_content, True, None)
        except Exception as e:
            logger.error(f"Error processing chunk {chunk_index + 1}: {e}")
            return (chunk_index, None, False, str(e))
    
    def merge_audio_chunks(self, audio_chunks: list) -> bytes:
        """
        Merge multiple audio chunks into a single audio file.
        
        Args:
            audio_chunks: List of audio content bytes
            
        Returns:
            Merged audio content as bytes
        """
        try:
            if len(audio_chunks) == 1:
                return audio_chunks[0]
            
            logger.info(f"Merging {len(audio_chunks)} audio chunks")
            
            # Convert bytes to AudioSegment objects
            segments = []
            temp_files = []
            
            for i, audio_bytes in enumerate(audio_chunks):
                # Create temporary file for pydub
                temp_file = tempfile.NamedTemporaryFile(suffix='.mp3', delete=False)
                temp_file.write(audio_bytes)
                temp_file.close()  # Close file handle before using
                temp_file_path = temp_file.name
                temp_files.append(temp_file_path)
                
                try:
                    # Load audio segment
                    segment = AudioSegment.from_mp3(temp_file_path)
                    segments.append(segment)
                    logger.info(f"Loaded chunk {i + 1}: {len(segment)}ms")
                except Exception as e:
                    logger.error(f"Error loading chunk {i + 1}: {e}")
                    raise
            
            # Clean up all temporary files after loading
            for temp_file_path in temp_files:
                try:
                    os.unlink(temp_file_path)
                except Exception as e:
                    logger.warning(f"Could not delete temp file {temp_file_path}: {e}")
            
            # Concatenate all segments
            merged_audio = segments[0]
            for segment in segments[1:]:
                merged_audio += segment
            
            # Export to bytes
            temp_export_file = tempfile.NamedTemporaryFile(suffix='.mp3', delete=False)
            temp_export_file.close()  # Close file handle before using
            
            try:
                merged_audio.export(temp_export_file.name, format='mp3')
                with open(temp_export_file.name, 'rb') as f:
                    result = f.read()
            finally:
                try:
                    os.unlink(temp_export_file.name)
                except Exception as e:
                    logger.warning(f"Could not delete export temp file: {e}")
            
            logger.info(f"✅ Audio merging completed. Total duration: {len(merged_audio)}ms")
            return result
            
        except Exception as e:
            logger.error(f"Error merging audio chunks: {e}")
            raise
    
    def text_to_speech(self, text: str, voice: str = None, speed: float = None) -> bytes:
        """
        Convert text to speech using Google Cloud TTS.
        
        Args:
            text: Text to convert
            voice: Voice to use
            speed: Speech speed (0.25 to 4.0)
            
        Returns:
            Audio content as bytes
        """
        voice = voice or self.default_voice
        speed = speed or self.default_speed
        
        if voice not in self.available_voices:
            raise ValueError(f"Invalid voice. Available voices: {list(self.voice_names.values())}")
        
        if not 0.25 <= speed <= 4.0:
            raise ValueError("Speed must be between 0.25 and 4.0")
        
        try:
            voice_name = self.voice_names.get(voice, voice)
            logger.info(f"Generating speech for {len(text)} characters with voice '{voice_name}'")
            
            # Set the text input to be synthesized
            synthesis_input = texttospeech.SynthesisInput(text=text)
            
            # Build the voice request
            voice_request = texttospeech.VoiceSelectionParams(
                language_code="en-US",
                name=voice,
                ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
            )
            
            # Select the type of audio file you want returned
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3,
                speaking_rate=speed,
                sample_rate_hertz=22050
            )
            
            # Perform the text-to-speech request
            response = self.tts_client.synthesize_speech(
                input=synthesis_input,
                voice=voice_request,
                audio_config=audio_config
            )
            
            logger.info(f"Speech generated successfully: {len(response.audio_content)} bytes")
            return response.audio_content
            
        except Exception as e:
            logger.error(f"Error generating speech: {e}")
            raise
    
    def upload_to_gcs(self, audio_content: bytes, filename: str) -> str:
        """
        Upload audio file to Google Cloud Storage.
        
        Args:
            audio_content: Audio content as bytes
            filename: Name for the file in GCS
            
        Returns:
            Public URL of uploaded file or local file path if GCS is not available
        """
        if not self.gcs_client or not self.bucket:
            # Fallback to local storage if GCS is not configured
            local_path = os.path.join("uploads", "audiobooks", filename)
            os.makedirs(os.path.dirname(local_path), exist_ok=True)
            
            with open(local_path, 'wb') as f:
                f.write(audio_content)
            
            logger.info(f"✅ Audio saved locally: {local_path}")
            return f"file://{local_path}"
        
        try:
            # Create blob
            blob = self.bucket.blob(filename)
            
            # Upload content
            blob.upload_from_string(audio_content, content_type='audio/mpeg')
            
            # Make blob publicly readable
            blob.make_public()
            
            # Get public URL
            public_url = blob.public_url
            
            logger.info(f"✅ Audio uploaded to GCS: {public_url}")
            return public_url
            
        except Exception as e:
            logger.error(f"Error uploading to GCS: {e}")
            
            # Check if it's a Uniform Bucket-Level Access error
            if "uniform bucket-level access" in str(e).lower():
                logger.error("⚠️  Uniform Bucket-Level Access is enabled. Please either:")
                logger.error("   1. Disable Uniform Bucket-Level Access in bucket settings, OR")
                logger.error("   2. Add 'allUsers' with 'Storage Object Viewer' role in bucket permissions")
            
            # Fallback to local storage
            local_path = os.path.join("uploads", "audiobooks", filename)
            os.makedirs(os.path.dirname(local_path), exist_ok=True)
            
            with open(local_path, 'wb') as f:
                f.write(audio_content)
            
            logger.info(f"✅ Audio saved locally as fallback: {local_path}")
            return f"file://{local_path}"
    
    def convert_pdf_to_audio(
        self, 
        pdf_path: str, 
        voice: str = None, 
        speed: float = None,
        output_filename: str = None
    ) -> dict:
        """
        Complete PDF to audio conversion pipeline.
        
        Args:
            pdf_path: Path to PDF file
            voice: Voice to use for TTS
            speed: Speech speed
            output_filename: Optional filename for GCS (without extension)
            
        Returns:
            Dictionary with conversion results
        """
        start_time = datetime.now()
        
        try:
            # Generate unique filename if not provided
            if not output_filename:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                output_filename = f"audiobook_{timestamp}_{uuid.uuid4().hex[:8]}"
            
            gcs_filename = f"audio/{output_filename}.mp3"
            
            logger.info(f"Starting PDF to audio conversion: {pdf_path}")
            
            # Step 1: Extract text from PDF
            raw_text = self.extract_text_from_pdf(pdf_path)
            
            # Step 2: Clean text
            cleaned_text = self.clean_text(raw_text)
            
            if not cleaned_text:
                raise ValueError("No text extracted from PDF")
            
            # Step 3: Generate speech (with parallel processing for long texts)
            chunks = self.split_text_into_chunks(cleaned_text)
            
            if len(chunks) == 1:
                # Single chunk - process normally
                audio_content = self.text_to_speech(cleaned_text, voice, speed)
            else:
                # Multiple chunks - process in parallel
                logger.info(f"Processing {len(chunks)} chunks in parallel (max {self.max_parallel_requests} concurrent)")
                
                # Process chunks in parallel with ThreadPoolExecutor
                with concurrent.futures.ThreadPoolExecutor(max_workers=self.max_parallel_requests) as executor:
                    # Submit all chunk processing tasks
                    future_to_chunk = {
                        executor.submit(self.process_text_chunk, chunk, voice, speed, i): i
                        for i, chunk in enumerate(chunks)
                    }
                    
                    # Collect results in order
                    chunk_results = [None] * len(chunks)
                    for future in concurrent.futures.as_completed(future_to_chunk):
                        chunk_index, audio_content, success, error = future.result()
                        if success:
                            chunk_results[chunk_index] = audio_content
                        else:
                            raise Exception(f"Chunk {chunk_index + 1} failed: {error}")
                
                # Merge all audio chunks
                audio_content = self.merge_audio_chunks(chunk_results)
            
            # Step 4: Upload to GCS
            public_url = self.upload_to_gcs(audio_content, gcs_filename)
            
            # Calculate processing time
            processing_time = (datetime.now() - start_time).total_seconds()
            
            # Return results
            result = {
                "success": True,
                "public_url": public_url,
                "gcs_filename": gcs_filename,
                "original_pdf": pdf_path,
                "text_length": len(cleaned_text),
                "audio_size_bytes": len(audio_content),
                "voice": voice or self.default_voice,
                "voice_name": self.voice_names.get(voice or self.default_voice, "Unknown"),
                "speed": speed or self.default_speed,
                "processing_time_seconds": processing_time,
                "chunks_processed": len(chunks),
                "parallel_processing": len(chunks) > 1,
                "created_at": datetime.now().isoformat()
            }
            
            logger.info(f"✅ PDF to audio conversion completed in {processing_time:.2f} seconds")
            return result
            
        except Exception as e:
            logger.error(f"❌ PDF to audio conversion failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "processing_time_seconds": (datetime.now() - start_time).total_seconds()
            }
    
    def get_available_voices(self) -> list:
        """Get list of available voices."""
        return [
            {"id": voice_id, "name": name, "description": f"Google TTS: {name}"}
            for voice_id, name in self.voice_names.items()
        ]

# Example usage
if __name__ == "__main__":
    # Initialize converter
    converter = PDFToAudioConverter()
    
    # Example PDF path (replace with your PDF)
    pdf_path = "example.pdf"
    
    if os.path.exists(pdf_path):
        # Convert PDF to audio
        result = converter.convert_pdf_to_audio(
            pdf_path=pdf_path,
            voice="en-US-Standard-A",
            speed=1.0
        )
        
        if result["success"]:
            print(f"✅ Success! Audio available at: {result['public_url']}")
            print(f"📊 Processing time: {result['processing_time_seconds']:.2f} seconds")
            print(f"📝 Text length: {result['text_length']} characters")
            print(f"🎵 Audio size: {result['audio_size_bytes']} bytes")
        else:
            print(f"❌ Conversion failed: {result['error']}")
    else:
        print(f"❌ PDF file not found: {pdf_path}")
        print("Please provide a valid PDF file path.")
