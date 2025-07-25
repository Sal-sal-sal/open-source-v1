#!/usr/bin/env python3
"""
Модуль для работы с Google Cloud Storage.
Обеспечивает загрузку транскрибированных аудио файлов и их извлечение для создания заметок.
"""

import os
import json
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
from google.cloud import storage
from google.cloud.exceptions import NotFound
from dotenv import load_dotenv

# Configure logging
logger = logging.getLogger(__name__)

load_dotenv()

class GCSStorageManager:
    """Менеджер для работы с Google Cloud Storage"""
    
    def __init__(self, bucket_name: str = None):
        """
        Инициализация менеджера GCS
        
        Args:
            bucket_name: Имя bucket в GCS (если не указано, берется из переменных окружения)
        """
        self.bucket_name = bucket_name or os.getenv("GCS_BUCKET_NAME")
        if not self.bucket_name:
            raise ValueError("GCS_BUCKET_NAME не указан в переменных окружения")
        
        # Инициализируем клиент GCS
        try:
            self.client = storage.Client()
            self.bucket = self.client.bucket(self.bucket_name)
            logger.info(f"GCS Storage Manager initialized with bucket: {self.bucket_name}")
        except Exception as e:
            logger.error(f"Failed to initialize GCS client: {str(e)}")
            raise
    
    def upload_transcript(
        self, 
        file_id: str, 
        transcript_data: Dict[str, Any], 
        original_filename: str,
        user_id: str
    ) -> str:
        """
        Загружает транскрибированный текст в GCS
        
        Args:
            file_id: Уникальный ID файла
            transcript_data: Данные транскрипции
            original_filename: Оригинальное имя файла
            user_id: ID пользователя
            
        Returns:
            str: GCS URL загруженного файла
        """
        try:
            # Создаем метаданные
            metadata = {
                "file_id": file_id,
                "user_id": user_id,
                "original_filename": original_filename,
                "upload_timestamp": datetime.utcnow().isoformat(),
                "transcript_length": len(transcript_data.get("transcript", "")),
                "chunk_count": transcript_data.get("chunk_count", 0),
                "total_duration": transcript_data.get("total_duration", 0),
                "service_used": transcript_data.get("service_used", "unknown"),
                "model": transcript_data.get("model", "unknown"),
                "language": transcript_data.get("language", "auto"),
                "task": transcript_data.get("task", "transcribe")
            }
            
            # Создаем имя файла в GCS
            gcs_filename = f"transcripts/{user_id}/{file_id}/transcript.json"
            
            # Создаем blob
            blob = self.bucket.blob(gcs_filename)
            
            # Устанавливаем метаданные
            blob.metadata = metadata
            blob.content_type = "application/json"
            
            # Загружаем данные
            blob.upload_from_string(
                json.dumps(transcript_data, ensure_ascii=False, indent=2),
                content_type="application/json"
            )
            
            gcs_url = f"gs://{self.bucket_name}/{gcs_filename}"
            logger.info(f"Transcript uploaded successfully: {gcs_url}")
            
            return gcs_url
            
        except Exception as e:
            logger.error(f"Failed to upload transcript: {str(e)}")
            raise
    
    def get_transcript(self, file_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Получает транскрибированный текст из GCS
        
        Args:
            file_id: ID файла
            user_id: ID пользователя
            
        Returns:
            Dict[str, Any]: Данные транскрипции или None если не найдено
        """
        try:
            gcs_filename = f"transcripts/{user_id}/{file_id}/transcript.json"
            print(f"Checking GCS for transcript: {gcs_filename}")
            blob = self.bucket.blob(gcs_filename)
            
            if not blob.exists():
                print(f"Transcript blob does not exist: {gcs_filename}")
                logger.warning(f"Transcript not found: {gcs_filename}")
                return None
            
            # Загружаем данные
            content = blob.download_as_text(encoding='utf-8')
            transcript_data = json.loads(content)
            
            print(f"Successfully loaded transcript data for: {gcs_filename}")
            logger.info(f"Transcript retrieved successfully: {gcs_filename}")
            return transcript_data
            
        except Exception as e:
            print(f"Error getting transcript: {str(e)}")
            logger.error(f"Failed to get transcript: {str(e)}")
            return None
    
    def list_user_transcripts(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Получает список всех транскрипций пользователя
        
        Args:
            user_id: ID пользователя
            
        Returns:
            List[Dict[str, Any]]: Список транскрипций с метаданными
        """
        try:
            prefix = f"transcripts/{user_id}/"
            blobs = self.client.list_blobs(self.bucket_name, prefix=prefix)
            
            transcripts = []
            for blob in blobs:
                if blob.name.endswith("/transcript.json"):
                    # Извлекаем file_id из пути
                    path_parts = blob.name.split("/")
                    if len(path_parts) >= 3:
                        file_id = path_parts[2]
                        
                        transcript_info = {
                            "file_id": file_id,
                            "gcs_url": f"gs://{self.bucket_name}/{blob.name}",
                            "upload_timestamp": blob.metadata.get("upload_timestamp"),
                            "original_filename": blob.metadata.get("original_filename"),
                            "transcript_length": blob.metadata.get("transcript_length"),
                            "total_duration": blob.metadata.get("total_duration"),
                            "service_used": blob.metadata.get("service_used"),
                            "model": blob.metadata.get("model"),
                            "language": blob.metadata.get("language")
                        }
                        transcripts.append(transcript_info)
            
            logger.info(f"Found {len(transcripts)} transcripts for user {user_id}")
            return transcripts
            
        except Exception as e:
            logger.error(f"Failed to list user transcripts: {str(e)}")
            return []
    
    def delete_transcript(self, file_id: str, user_id: str) -> bool:
        """
        Удаляет транскрипцию из GCS
        
        Args:
            file_id: ID файла
            user_id: ID пользователя
            
        Returns:
            bool: True если удалено успешно, False в противном случае
        """
        try:
            gcs_filename = f"transcripts/{user_id}/{file_id}/transcript.json"
            blob = self.bucket.blob(gcs_filename)
            
            if blob.exists():
                blob.delete()
                logger.info(f"Transcript deleted successfully: {gcs_filename}")
                return True
            else:
                logger.warning(f"Transcript not found for deletion: {gcs_filename}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to delete transcript: {str(e)}")
            return False
    
    def upload_voice_message(
        self, 
        message_id: str, 
        transcript_text: str, 
        user_id: str,
        chat_id: str = None
    ) -> str:
        """
        Загружает транскрибированное голосовое сообщение в GCS
        
        Args:
            message_id: Уникальный ID сообщения
            transcript_text: Текст транскрипции
            user_id: ID пользователя
            chat_id: ID чата (опционально)
            
        Returns:
            str: GCS URL загруженного файла
        """
        try:
            # Создаем данные сообщения
            message_data = {
                "message_id": message_id,
                "user_id": user_id,
                "chat_id": chat_id,
                "transcript": transcript_text,
                "timestamp": datetime.utcnow().isoformat(),
                "type": "voice_message"
            }
            
            # Создаем имя файла в GCS
            gcs_filename = f"voice_messages/{user_id}/{message_id}/message.json"
            
            # Создаем blob
            blob = self.bucket.blob(gcs_filename)
            blob.content_type = "application/json"
            
            # Загружаем данные
            blob.upload_from_string(
                json.dumps(message_data, ensure_ascii=False, indent=2),
                content_type="application/json"
            )
            
            gcs_url = f"gs://{self.bucket_name}/{gcs_filename}"
            logger.info(f"Voice message uploaded successfully: {gcs_url}")
            
            return gcs_url
            
        except Exception as e:
            logger.error(f"Failed to upload voice message: {str(e)}")
            raise
    
    def get_voice_message(self, message_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Получает голосовое сообщение из GCS
        
        Args:
            message_id: ID сообщения
            user_id: ID пользователя
            
        Returns:
            Dict[str, Any]: Данные сообщения или None если не найдено
        """
        try:
            gcs_filename = f"voice_messages/{user_id}/{message_id}/message.json"
            blob = self.bucket.blob(gcs_filename)
            
            if not blob.exists():
                logger.warning(f"Voice message not found: {gcs_filename}")
                return None
            
            # Загружаем данные
            content = blob.download_as_text(encoding='utf-8')
            message_data = json.loads(content)
            
            logger.info(f"Voice message retrieved successfully: {gcs_filename}")
            return message_data
            
        except Exception as e:
            logger.error(f"Failed to get voice message: {str(e)}")
            return None

# Global instance
gcs_manager = GCSStorageManager()

def upload_transcript_to_gcs(
    file_id: str, 
    transcript_data: Dict[str, Any], 
    original_filename: str,
    user_id: str
) -> str:
    """
    Удобная функция для загрузки транскрипции в GCS
    
    Args:
        file_id: Уникальный ID файла
        transcript_data: Данные транскрипции
        original_filename: Оригинальное имя файла
        user_id: ID пользователя
        
    Returns:
        str: GCS URL загруженного файла
    """
    return gcs_manager.upload_transcript(file_id, transcript_data, original_filename, user_id)

def get_transcript_from_gcs(file_id: str, user_id: str) -> Optional[Dict[str, Any]]:
    """
    Удобная функция для получения транскрипции из GCS
    
    Args:
        file_id: ID файла
        user_id: ID пользователя
        
    Returns:
        Dict[str, Any]: Данные транскрипции или None
    """
    return gcs_manager.get_transcript(file_id, user_id)

def upload_voice_message_to_gcs(
    message_id: str, 
    transcript_text: str, 
    user_id: str,
    chat_id: str = None
) -> str:
    """
    Удобная функция для загрузки голосового сообщения в GCS
    
    Args:
        message_id: Уникальный ID сообщения
        transcript_text: Текст транскрипции
        user_id: ID пользователя
        chat_id: ID чата (опционально)
        
    Returns:
        str: GCS URL загруженного файла
    """
    return gcs_manager.upload_voice_message(message_id, transcript_text, user_id, chat_id)

def get_voice_message_from_gcs(message_id: str, user_id: str) -> Optional[Dict[str, Any]]:
    """
    Удобная функция для получения голосового сообщения из GCS
    
    Args:
        message_id: ID сообщения
        user_id: ID пользователя
        
    Returns:
        Dict[str, Any]: Данные сообщения или None
    """
    return gcs_manager.get_voice_message(message_id, user_id) 