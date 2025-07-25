#!/usr/bin/env python3
"""
Модуль для транскрипции аудиокниг с использованием Distil-Whisper.
Оптимизирован для длинных аудио файлов с высокой точностью и скоростью.
"""

import os
import requests
import logging
import asyncio
from typing import Optional, List, Dict, Any
from fastapi import UploadFile, HTTPException
from dotenv import load_dotenv
import tempfile
import json
import time

# Configure logging
logger = logging.getLogger(__name__)

load_dotenv()

# API endpoints for different services
DISTIL_WHISPER_ENDPOINTS = {
    "groq": "https://api.groq.com/openai/v1/audio/transcriptions",
    "openai": "https://api.openai.com/v1/audio/transcriptions",
    "local": None  # For local Distil-Whisper installation
}

class DistilWhisperTranscriber:
    """Класс для транскрипции аудиокниг с использованием Distil-Whisper"""
    
    def __init__(self, preferred_service: str = "groq"):
        """
        Инициализация транскрайбера
        
        Args:
            preferred_service: "groq", "openai", или "local"
        """
        self.preferred_service = preferred_service.lower()
        self.api_keys = {
            "groq": os.getenv("GROQ_API_KEY"),
            "openai": os.getenv("OPENAI_API_KEY")
        }
        
        logger.info(f"DistilWhisper initialized with service: {self.preferred_service}")
        
    def is_service_available(self, service: str) -> bool:
        """Проверяет доступность сервиса"""
        if service == "local":
            # TODO: Add local Distil-Whisper check
            return False
        return bool(self.api_keys.get(service))
    
    async def transcribe_audiobook(
        self, 
        file: UploadFile, 
        chunk_size: int = 120,  # Увеличил с 30 до 120 секунд для скорости
        overlap: int = 1,       # Уменьшил с 2 до 1 секунды
        language: str = "auto",
        task: str = "transcribe",
        fast_mode: bool = True  # Новый параметр для быстрого режима
    ) -> Dict[str, Any]:
        """
        Транскрибирует аудиокнигу с разбивкой на чанки
        
        Args:
            file: Аудио файл
            chunk_size: Размер чанка в секундах (увеличен для скорости)
            overlap: Перекрытие между чанками в секундах (уменьшено)
            language: Язык аудио ("auto" для автоопределения)
            task: "transcribe" или "translate"
            fast_mode: Быстрый режим без детальных timestamps
            
        Returns:
            Словарь с результатами транскрипции
        """
        start_time = time.time()
        logger.info(f"Starting audiobook transcription: {file.filename}")
        
        # Сохраняем файл временно
        temp_file = await self._save_temp_file(file)
        
        try:
            # Получаем информацию о файле
            file_info = await self._get_audio_info(temp_file)
            duration = file_info.get("duration", 0)
            
            if duration == 0:
                raise HTTPException(status_code=400, detail="Could not determine audio duration")
            
            logger.info(f"Audio duration: {duration} seconds")
            
            # Быстрый режим для коротких файлов (до 5 минут)
            if fast_mode and duration <= 300:  # 5 минут
                logger.info("Using fast mode for short audio file")
                return await self._transcribe_fast_mode(temp_file, language, task, duration)
            
            # Разбиваем на чанки
            chunks = self._create_chunks(duration, chunk_size, overlap)
            logger.info(f"Created {len(chunks)} chunks for processing")
            
            # Транскрибируем каждый чанк параллельно
            transcripts = []
            timestamps = []
            
            # Создаем задачи для параллельной обработки
            tasks = []
            for i, (start, end) in enumerate(chunks):
                task_obj = self._transcribe_chunk(
                    temp_file, start, end, language, task, i+1, len(chunks)
                )
                tasks.append(task_obj)
            
            # Выполняем все задачи параллельно
            chunk_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Обрабатываем результаты
            for i, result in enumerate(chunk_results):
                if isinstance(result, Exception):
                    logger.error(f"Chunk {i+1} failed: {str(result)}")
                    continue
                if result:
                    transcripts.append(result.get("text", ""))
                    timestamps.append((chunks[i][0], chunks[i][1]))
            
            # Объединяем результаты
            full_transcript = " ".join(transcripts)
            
            total_time = time.time() - start_time
            logger.info(f"Transcription completed in {total_time:.2f} seconds")
            
            return {
                "transcript": full_transcript,
                "total_duration": duration,
                "chunk_count": len(chunks),
                "service_used": self.preferred_service,
                "model": "whisper-large-v3-turbo",
                "processing_time": total_time,
                "chunks_processed": len([r for r in chunk_results if not isinstance(r, Exception)])
            }
            
        finally:
            # Удаляем временный файл
            if os.path.exists(temp_file):
                os.remove(temp_file)
    
    async def _transcribe_fast_mode(
        self, 
        file_path: str, 
        language: str, 
        task: str, 
        duration: float
    ) -> Dict[str, Any]:
        """Быстрый режим транскрибации без чанкинга"""
        start_time = time.time()
        logger.info("Starting fast mode transcription")
        
        try:
            if self.preferred_service == "groq" and self.is_service_available("groq"):
                result = await self._transcribe_with_groq_fast(file_path, language, task)
            elif self.preferred_service == "openai" and self.is_service_available("openai"):
                result = await self._transcribe_with_openai_fast(file_path, language, task)
            else:
                # Fallback
                if self.is_service_available("groq"):
                    result = await self._transcribe_with_groq_fast(file_path, language, task)
                elif self.is_service_available("openai"):
                    result = await self._transcribe_with_openai_fast(file_path, language, task)
                else:
                    raise HTTPException(status_code=500, detail="No transcription service available")
            
            total_time = time.time() - start_time
            logger.info(f"Fast mode transcription completed in {total_time:.2f} seconds")
            
            return {
                "transcript": result.get("text", ""),
                "total_duration": duration,
                "chunk_count": 1,
                "service_used": self.preferred_service,
                "model": "whisper-large-v3-turbo",
                "processing_time": total_time,
                "mode": "fast"
            }
            
        except Exception as e:
            logger.error(f"Fast mode transcription failed: {str(e)}")
            raise

    async def _save_temp_file(self, file: UploadFile) -> str:
        """Сохраняет файл во временную директорию"""
        temp_dir = tempfile.gettempdir()
        temp_path = os.path.join(temp_dir, f"audiobook_{file.filename}")
        
        with open(temp_path, "wb") as buffer:
            buffer.write(await file.read())
        
        return temp_path
    
    async def _get_audio_info(self, file_path: str) -> Dict[str, Any]:
        """Получает информацию об аудио файле"""
        try:
            # Используем ffprobe для получения информации
            import subprocess
            
            cmd = [
                "ffprobe", 
                "-v", "quiet", 
                "-print_format", "json", 
                "-show_format", 
                file_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                data = json.loads(result.stdout)
                duration = float(data["format"]["duration"])
                return {"duration": duration}
            else:
                logger.warning("Could not get audio info with ffprobe, using default")
                return {"duration": 0}
                
        except Exception as e:
            logger.warning(f"Error getting audio info: {str(e)}")
            return {"duration": 0}
    
    def _create_chunks(self, duration: float, chunk_size: int, overlap: int) -> List[tuple]:
        """Создает список чанков для обработки"""
        chunks = []
        start = 0
        
        while start < duration:
            end = min(start + chunk_size, duration)
            chunks.append((start, end))
            start = end - overlap
            
            if start >= duration:
                break
        
        return chunks
    
    async def _transcribe_chunk(
        self, 
        file_path: str, 
        start: float, 
        end: float, 
        language: str,
        task: str,
        chunk_num: int,
        total_chunks: int
    ) -> Optional[Dict[str, Any]]:
        """Транскрибирует отдельный чанк"""
        
        logger.info(f"Processing chunk {chunk_num}/{total_chunks}: {start:.1f}s - {end:.1f}s")
        
        # Создаем временный файл для чанка
        chunk_file = await self._extract_chunk(file_path, start, end)
        
        try:
            if self.preferred_service == "groq" and self.is_service_available("groq"):
                return await self._transcribe_with_groq_fast(chunk_file, language, task)
            elif self.preferred_service == "openai" and self.is_service_available("openai"):
                return await self._transcribe_with_openai_fast(chunk_file, language, task)
            else:
                # Fallback to available service
                if self.is_service_available("groq"):
                    return await self._transcribe_with_groq_fast(chunk_file, language, task)
                elif self.is_service_available("openai"):
                    return await self._transcribe_with_openai_fast(chunk_file, language, task)
                else:
                    raise HTTPException(status_code=500, detail="No transcription service available")
        finally:
            # Удаляем временный чанк
            if os.path.exists(chunk_file):
                os.remove(chunk_file)
    
    async def _extract_chunk(self, file_path: str, start: float, end: float) -> str:
        """Извлекает чанк из аудио файла"""
        import subprocess
        
        temp_dir = tempfile.gettempdir()
        chunk_path = os.path.join(temp_dir, f"chunk_{start}_{end}.wav")
        
        # Используем ffmpeg для извлечения чанка
        cmd = [
            "ffmpeg",
            "-i", file_path,
            "-ss", str(start),
            "-t", str(end - start),
            "-c", "copy",
            "-y",  # Overwrite output file
            chunk_path
        ]
        
        result = subprocess.run(cmd, capture_output=True)
        
        if result.returncode != 0:
            raise Exception(f"Failed to extract chunk: {result.stderr.decode()}")
        
        return chunk_path
    
    async def _transcribe_with_groq_fast(self, file_path: str, language: str, task: str) -> Dict[str, Any]:
        """Быстрая транскрибация с помощью Groq API (оптимизированная)"""
        headers = {
            "Authorization": f"Bearer {self.api_keys['groq']}"
        }
        
        with open(file_path, "rb") as audio_file:
            files = {"file": audio_file}
            data = {
                "model": "whisper-large-v3-turbo",
                "response_format": "json",  # Убрал verbose_json для скорости
                "language": language if language != "auto" else None
            }
            
            # Добавляем промпт для лучшего качества
            if task == "transcribe":
                data["prompt"] = "This is a transcription of audio content."
            
            response = requests.post(
                DISTIL_WHISPER_ENDPOINTS["groq"], 
                headers=headers, 
                files=files, 
                data=data
            )
        
        if response.status_code == 200:
            result = response.json()
            return {
                "text": result.get("text", ""),
                "words": []  # Пустой список для совместимости
            }
        else:
            raise Exception(f"Groq API error: {response.status_code} - {response.text}")
    
    async def _transcribe_with_openai_fast(self, file_path: str, language: str, task: str) -> Dict[str, Any]:
        """Быстрая транскрибация с помощью OpenAI API (оптимизированная)"""
        headers = {
            "Authorization": f"Bearer {self.api_keys['openai']}"
        }
        
        with open(file_path, "rb") as audio_file:
            files = {"file": audio_file}
            data = {
                "model": "whisper-1",
                "response_format": "json",  # Убрал verbose_json для скорости
                "language": language if language != "auto" else None
            }
            
            # Добавляем промпт для лучшего качества
            if task == "transcribe":
                data["prompt"] = "This is a transcription of audio content."
            
            response = requests.post(
                DISTIL_WHISPER_ENDPOINTS["openai"], 
                headers=headers, 
                files=files, 
                data=data
            )
        
        if response.status_code == 200:
            result = response.json()
            return {
                "text": result.get("text", ""),
                "words": []  # Пустой список для совместимости
            }
        else:
            raise Exception(f"OpenAI API error: {response.status_code} - {response.text}")

    # Оставляем старые методы для совместимости
    async def _transcribe_with_groq(self, file_path: str, language: str, task: str) -> Dict[str, Any]:
        """Транскрибирует с помощью Groq API (старый метод для совместимости)"""
        return await self._transcribe_with_groq_fast(file_path, language, task)
    
    async def _transcribe_with_openai(self, file_path: str, language: str, task: str) -> Dict[str, Any]:
        """Транскрибирует с помощью OpenAI API (старый метод для совместимости)"""
        return await self._transcribe_with_openai_fast(file_path, language, task)

# Global instance
distil_whisper_transcriber = DistilWhisperTranscriber()

async def transcribe_audiobook(
    file: UploadFile,
    chunk_size: int = 30,
    overlap: int = 2,
    language: str = "auto",
    task: str = "transcribe",
    service: str = "groq",
    fast_mode: bool = True
) -> Dict[str, Any]:
    """
    Удобная функция для транскрипции аудиокниг
    
    Args:
        file: Аудио файл
        chunk_size: Размер чанка в секундах
        overlap: Перекрытие между чанками
        language: Язык аудио
        task: "transcribe" или "translate"
        service: "groq", "openai", или "local"
        fast_mode: Быстрый режим без детальных timestamps
        
    Returns:
        Результат транскрипции
    """
    transcriber = DistilWhisperTranscriber(service)
    return await transcriber.transcribe_audiobook(file, chunk_size, overlap, language, task, fast_mode) 