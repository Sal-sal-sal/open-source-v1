from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
import json

from core.db import get_async_session, DocumentQA
from core.models import ChatRequest, ChatResponse
from assistance.ai_teacher import AITeacher
from assistance.document_processor import document_processor_singleton as document_processor

router = APIRouter(prefix="/api")

@router.post("/doc_chat", response_model=ChatResponse, tags=["doc_chat"])
async def doc_chat(
    request: ChatRequest,
    ai_teacher: AITeacher = Depends(AITeacher),
):
    """Endpoint to chat with the AI Teacher about a document."""
    doc_info = document_processor.get_document_info(request.file_id)
    if not doc_info:
        raise HTTPException(status_code=404, detail=f"Document with ID {request.file_id} not found")
    embeddings_service = document_processor.get_embeddings_service(request.file_id)
    if not embeddings_service:
        raise HTTPException(status_code=500, detail="Embeddings not found for document")
    try:
        async with get_async_session() as session:
            answer, sources, confidence = await ai_teacher.answer_question(
                file_id=request.file_id,
                question=request.message,
                db=session,
            )
            
            # Persist QA record
            qa_record = DocumentQA(
                file_id=request.file_id,
                question=request.message,
                answer=answer,
                sources=json.dumps(sources),
                confidence=confidence,
            )
            session.add(qa_record)
            await session.commit()

            return ChatResponse(
                answer=answer,
                sources=sources,
                confidence=confidence,
            )
    except Exception as e:
        # Consider logging the error
        raise HTTPException(status_code=500, detail=str(e)) 