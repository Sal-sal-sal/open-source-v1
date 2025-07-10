from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pathlib import Path
from core.db import get_async_session, Document

router = APIRouter()

@router.get("/file/{file_id}")
async def get_uploaded_file(file_id: str):
    """Serve the original uploaded file (PDF/TXT)."""
    async with get_async_session() as session:
        doc_info = await session.get(Document, file_id)
        if not doc_info:
            raise HTTPException(status_code=404, detail="Document not found")

        file_path = Path(doc_info.file_path)
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found on disk")

        media_type = "application/pdf" if doc_info.file_type == "pdf" else "text/plain"
        return FileResponse(str(file_path), media_type=media_type, filename=doc_info.filename) 