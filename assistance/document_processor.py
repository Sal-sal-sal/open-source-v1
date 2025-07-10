"""
Document processing service for handling file uploads and text extraction.
"""
import uuid
import json
import pickle
from typing import Dict, List, Optional
from datetime import datetime
from pathlib import Path
from sqlmodel import Session, select
from fastapi import BackgroundTasks

from assistance.pdf_reader import (
    extract_text_from_pdf_by_page,
    extract_text_from_txt,
    get_pdf_page_count,
)
from assistance.text_splitter import split_text_into_chunks
from assistance.embeddings import EmbeddingsService, Document
from core.config import get_settings
from core.models import DocumentInfo
from core.db import Document as DocumentDB

def _get_cache_path(file_id: str, from_page: int, to_page: int) -> Path:
    """Generate a unique cache path for a document and page range."""
    cache_dir = Path("cache") / "embeddings"
    cache_dir.mkdir(parents=True, exist_ok=True)
    return cache_dir / f"{file_id}_{from_page}_{to_page}.pkl"

class DocumentProcessor:
    """Service for processing uploaded documents."""
    
    def __init__(self):
        """Initialize the document processor."""
        self.settings = get_settings()
        self.embeddings_service = EmbeddingsService(self.settings.embedding_model)
        self.documents_store: Dict[str, DocumentInfo] = {}
        self.embeddings_store: Dict[str, EmbeddingsService] = {}
        
    async def save_document(
        self, file_path: str, filename: str, db: Session
    ) -> DocumentInfo:
        """Saves the document, extracts full text, and creates a DB record."""
        file_id = Path(file_path).stem
        file_type = filename.split('.')[-1].lower()
        
        upload_dir = Path(self.settings.upload_dir)
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        full_text_path = None
        total_pages = None
        if file_type == 'pdf':
            with open(file_path, "rb") as f:
                file_content = f.read()
            total_pages = get_pdf_page_count(file_content)
            page_texts = extract_text_from_pdf_by_page(file_content)
            full_text_path = upload_dir / f"{file_id}_full_text.json"
            with full_text_path.open("w", encoding="utf-8") as f:
                json.dump(page_texts, f, ensure_ascii=False, indent=2)
        
        db_doc = DocumentDB(
            file_id=file_id,
            filename=filename,
            file_type=file_type,
            file_path=file_path,
            full_text_path=str(full_text_path) if full_text_path else None,
            status="uploaded",
            total_pages=total_pages,
        )
        db.add(db_doc)
        await db.commit()
        await db.refresh(db_doc)

        doc_info = DocumentInfo.model_validate(db_doc.__dict__)
        self.documents_store[file_id] = doc_info
        return doc_info

    async def process_document_pages(
        self,
        file_id: str,
        from_page: int,
        to_page: int,
        db: Session,
        background_tasks: BackgroundTasks,
    ) -> DocumentInfo:
        """
        Initiates background processing for a specific page range of a document.
        """
        db_doc = await db.get(DocumentDB, file_id)
        if not db_doc:
            raise ValueError("Document not found")

        cache_path = _get_cache_path(file_id, from_page, to_page)
        if cache_path.exists():
            db_doc.processing_status = "complete"
            await db.commit()
            await db.refresh(db_doc)
            return DocumentInfo.model_validate(db_doc.__dict__)

        db_doc.processing_status = "processing"
        await db.commit()
        await db.refresh(db_doc)
        
        background_tasks.add_task(
            self._process_and_cache_embeddings,
            file_id,
            from_page,
            to_page,
            db,
        )
        return DocumentInfo.model_validate(db_doc.__dict__)

    async def _process_and_cache_embeddings(
        self, file_id: str, from_page: int, to_page: int, db: Session
    ):
        """The actual processing logic that runs in the background."""
        db_doc = await db.get(DocumentDB, file_id)
        try:
            text_to_process = ""
            if db_doc.file_type == 'pdf':
                with open(db_doc.full_text_path, "r", encoding="utf-8") as f:
                    page_texts = json.load(f)
                text_to_process = "\\n".join(page_texts[from_page-1:to_page])
            elif db_doc.file_type == 'txt':
                with open(db_doc.file_path, "rb") as f:
                    text_to_process = extract_text_from_txt(f.read())
            
            chunks = split_text_into_chunks(text_to_process, self.settings.chunk_size, self.settings.chunk_overlap)
            embeddings = self.embeddings_service.create_embeddings(chunks)
            
            documents = [Document(id=f"{file_id}_{i}", text=chunk, embedding=embedding) for i, (chunk, embedding) in enumerate(zip(chunks, embeddings))]
            
            cache_path = _get_cache_path(file_id, from_page, to_page)
            with open(cache_path, "wb") as f:
                pickle.dump(documents, f)

            db_doc.total_chunks = len(chunks)
            db_doc.processed_from_page = from_page
            db_doc.processed_to_page = to_page
            db_doc.processing_status = "complete"
        except Exception:
            db_doc.processing_status = "failed"
        finally:
            await db.commit()

    async def get_document_info(self, file_id: str, db: Session) -> Optional[DocumentInfo]:
        """Get information about a document."""
        if file_id in self.documents_store:
            return self.documents_store[file_id]
        print('\n\n\n\n',file_id,'\n\n')
        db_obj = await db.get(DocumentDB, file_id)
        if db_obj:
            return DocumentInfo.model_validate(db_obj.__dict__)
        return None

    def get_embeddings_service(self, file_id: str, from_page: int, to_page: int) -> Optional[EmbeddingsService]:
        """Get embeddings service from cache."""
        cache_path = _get_cache_path(file_id, from_page, to_page)
        if not cache_path.exists():
            return None
        
        with open(cache_path, "rb") as f:
            documents = pickle.load(f)
        
        service = EmbeddingsService(self.settings.embedding_model)
        service.build_index(documents)
        return service

    async def list_documents(self, db: Session) -> List[DocumentInfo]:
        """List all documents from the database."""
        result = await db.execute(select(DocumentDB))
        docs = result.scalars().all()
        return [DocumentInfo.model_validate(d.__dict__) for d in docs]


# -----------------------------------------------------------------------------
# Global singleton instance to share across routers
# -----------------------------------------------------------------------------

document_processor_singleton = DocumentProcessor()

# Explicit re-export for easy import
__all__ = [
    "DocumentProcessor",
    "document_processor_singleton",
] 