from fastapi import APIRouter, UploadFile, File, HTTPException, Query, Depends, BackgroundTasks
from sqlmodel import Session
from core.models import FileUploadResponse
from assistance.document_processor import document_processor_singleton as document_processor
from core.db import get_async_session, BookChat
from core.auth_utils import get_current_user, User
import uuid
from pathlib import Path

router = APIRouter()

@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
) -> FileUploadResponse:
    file_id = str(uuid.uuid4())
    file_type = file.filename.split('.')[-1].lower()
    upload_dir = Path("uploads")
    upload_dir.mkdir(parents=True, exist_ok=True)
    saved_file_path = upload_dir / f"{file_id}.{file_type}"
    
    with saved_file_path.open("wb") as buffer:
        buffer.write(await file.read())

    try:
        async with get_async_session() as session:
            doc_info = await document_processor.save_document(
                file_path=str(saved_file_path),
                filename=file.filename,
                user_id=current_user.id,
                db=session
            )

            # Create a BookChat for the new document
            book_chat = BookChat(
                file_id=doc_info.file_id,
                name=f"Chat for {file.filename}",
                user_id=current_user.id
            )
            session.add(book_chat)
            await session.commit()
            await session.refresh(book_chat)

            return FileUploadResponse(
                file_id=doc_info.file_id,
                filename=doc_info.filename,
                size_bytes=saved_file_path.stat().st_size,
                upload_time=doc_info.upload_time,
                status=doc_info.status,
                book_chat_id=book_chat.id,
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving file: {str(e)}")


@router.post("/process/{file_id}", response_model=FileUploadResponse)
async def process_document_endpoint(
    file_id: str,
    background_tasks: BackgroundTasks,
    from_page: int = Query(3, ge=1),
    to_page: int = Query(12, ge=1)
):
    if to_page < from_page or to_page - from_page + 1 > 60:
        raise HTTPException(status_code=400, detail="Page range invalid or exceeds 60 pages")

    try:
        async with get_async_session() as session:
            doc_info = await document_processor.process_document_pages(
                file_id=file_id,
                from_page=from_page,
                to_page=to_page,
                db=session,
                background_tasks=background_tasks
            )
            return FileUploadResponse(
                file_id=doc_info.file_id,
                filename=doc_info.filename,
                size_bytes=0, # Not ideal, but we don't have the content here
                upload_time=doc_info.upload_time,
                status=doc_info.status,
                chunks_count=doc_info.total_chunks,
                from_page=doc_info.from_page,
                to_page=doc_info.to_page,
            )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")


@router.get("/documents")
async def list_documents():
    async with get_async_session() as session:
        documents = await document_processor.list_documents(db=session)
        return {"documents": documents}