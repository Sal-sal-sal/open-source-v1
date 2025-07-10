from typing import List, Tuple, Optional
import os
import tiktoken

import google.generativeai as genai  # type: ignore

from assistance.embeddings import EmbeddingsService, Document
from core.config import get_settings
from sqlalchemy.orm import Session


class AITeacher:
    """Service for generating answers to questions based on document context."""
    
    def __init__(self):
        """Initialize the AI Teacher service."""
        self.settings = get_settings()
        # Настройка Gemini
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        self.model = genai.GenerativeModel(model_name)
        
    def generate_answer(
        self,
        question: str,
        context_chunks: List[str],
        use_rag: bool = True
    ) -> Tuple[str, float]:
        """
        Generate an answer to a question based on context.
        
        Args:
            question: User's question
            context_chunks: Relevant text chunks from the document
            use_rag: Whether to use RAG approach
            
        Returns:
            Tuple of (answer, confidence_score)
        """
        if not context_chunks:
            return "Извините, я не нашел релевантной информации в документе для ответа на ваш вопрос.", 0.0
            
        # Combine context chunks
        context = "\n\n".join(context_chunks)
        
        # Always use OpenAI for answer generation
        answer, confidence = self._generate_openai_answer(question, context)
        
        return answer, confidence
    
    def _generate_openai_answer(
        self, 
        question: str, 
        context: str
    ) -> Tuple[str, float]:
        """Generate answer using Gemini."""
        try:
            system = "Ты - дружелюбный и знающий учитель."
            full_prompt = (
                f"{system}\n\n"
                f"Контекст из учебника:\n{context}\n\n"
                f"Вопрос студента: {question}\n\n"
                "Пожалуйста, дай понятный и подробный ответ на вопрос, основываясь на предоставленном контексте. "
                "Если в контексте нет прямого ответа, постарайся объяснить связанные концепции.\n"
            )

            response = self.model.generate_content(full_prompt)
            answer = response.text.strip()
            confidence = 0.9  # предположительно высокий
            return answer, confidence
        except Exception as e:
            return f"Ошибка при генерации ответа: {str(e)}", 0.0
    
    async def answer_question(
        self,
        file_id: str,
        question: str,
        from_page: int,
        to_page: int,
        db: Session,
    ) -> Tuple[str, List[str], float]:
        """
        Answer a question using document embeddings.
        
        Args:
            file_id: The ID of the document to consult.
            question: User's question.
            from_page: The starting page of the relevant section.
            to_page: The ending page of the relevant section.
            db: The database session.
            
        Returns:
            Tuple of (answer, source_chunks, confidence)
        """
        # This part now needs the document_processor to get the embeddings
        from .document_processor import document_processor_singleton
        
        embeddings_service = document_processor_singleton.get_embeddings_service(file_id, from_page, to_page)
        if not embeddings_service:
            # Maybe the document exists but is not processed?
            doc_info = await document_processor_singleton.get_document_info(file_id, db)
            if doc_info and doc_info.status != "processed":
                return "Этот документ еще не обработан. Пожалуйста, обработайте его сначала.", [], 0.0
            return "Не удалось найти обработанные данные для этого документа.", [], 0.0

        # Gather many similar chunks (up to 100) and trim to token budget
        similar_docs = embeddings_service.search_similar(question, top_k=100)

        if not similar_docs:
            return "Извините, я не нашел релевантной информации в документе.", [], 0.0

        enc = tiktoken.get_encoding("cl100k_base")
        max_tokens = self.settings.max_context_tokens

        selected_chunks: list[str] = []
        total_tokens = 0

        for doc, _score in similar_docs:
            tokens = len(enc.encode(doc.text))
            if total_tokens + tokens > max_tokens:
                break
            selected_chunks.append(doc.text)
            total_tokens += tokens

        # Generate answer using selected context
        answer, confidence = self.generate_answer(question, selected_chunks)

        return answer, selected_chunks, confidence 