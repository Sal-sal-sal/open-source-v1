"""
LibriVox API integration for audiobooks
Provides search, metadata, and download functionality for free audiobooks
"""

import httpx
import json
from fastapi import APIRouter, HTTPException, Query, Response
from fastapi.responses import StreamingResponse, JSONResponse
from typing import List, Dict, Any, Optional
from urllib.parse import quote
import asyncio
import logging

router = APIRouter(prefix="/api/librivox", tags=["librivox"])

# LibriVox/Archive.org endpoints
ARCHIVE_SEARCH_URL = "https://archive.org/advancedsearch.php"
ARCHIVE_DETAILS_URL = "https://archive.org/details"
ARCHIVE_METADATA_URL = "https://archive.org/metadata"
ARCHIVE_DOWNLOAD_URL = "https://archive.org/download"

logger = logging.getLogger(__name__)

class LibriVoxAPI:
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def search_audiobooks(
        self, 
        query: str = "",
        author: str = "",
        title: str = "", 
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Search LibriVox audiobooks using Archive.org API"""
        
        # Build search query
        search_terms = []
        if query:
            search_terms.append(query)
        if author:
            search_terms.append(f'creator:"{author}"')
        if title:
            search_terms.append(f'title:"{title}"')
        
        # Default to collection search if no specific terms
        search_query = " AND ".join(search_terms) if search_terms else "*"
        
        # Add LibriVox collection filter
        full_query = f"({search_query}) AND collection:librivoxaudio"
        
        params = {
            "q": full_query,
            "fl": "identifier,title,creator,description,downloads,date,runtime,language,subject",
            "sort": "downloads desc",
            "rows": limit,
            "page": offset // limit + 1,
            "output": "json"
        }
        
        try:
            response = await self.client.get(ARCHIVE_SEARCH_URL, params=params)
            response.raise_for_status()
            data = response.json()
            
            return {
                "books": data.get("response", {}).get("docs", []),
                "total": data.get("response", {}).get("numFound", 0),
                "offset": offset,
                "limit": limit
            }
        except Exception as e:
            logger.error(f"LibriVox search error: {e}")
            raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")
    
    async def get_book_details(self, identifier: str) -> Dict[str, Any]:
        """Get detailed information about a specific audiobook"""
        
        try:
            # Get metadata
            response = await self.client.get(f"{ARCHIVE_METADATA_URL}/{identifier}")
            response.raise_for_status()
            metadata = response.json()
            
            # Extract useful information
            files = metadata.get("files", [])
            
            # Find audio files
            audio_files = []
            for file in files:
                if file.get("format") in ["VBR MP3", "MP3", "Ogg Vorbis"]:
                    audio_files.append({
                        "name": file.get("name", ""),
                        "title": file.get("title", file.get("name", "")),
                        "format": file.get("format", ""),
                        "size": file.get("size", "0"),
                        "length": file.get("length", ""),
                        "download_url": f"{ARCHIVE_DOWNLOAD_URL}/{identifier}/{file.get('name', '')}"
                    })
            
            # Get basic metadata
            meta = metadata.get("metadata", {})
            
            return {
                "identifier": identifier,
                "title": meta.get("title", ""),
                "creator": meta.get("creator", []),
                "description": meta.get("description", ""),
                "date": meta.get("date", ""),
                "language": meta.get("language", []),
                "subject": meta.get("subject", []),
                "runtime": meta.get("runtime", ""),
                "downloads": meta.get("downloads", 0),
                "audio_files": audio_files,
                "cover_url": f"https://archive.org/services/img/{identifier}",
                "archive_url": f"{ARCHIVE_DETAILS_URL}/{identifier}"
            }
            
        except Exception as e:
            logger.error(f"Get book details error: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to get book details: {str(e)}")
    
    async def get_popular_books(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get popular LibriVox audiobooks"""
        
        try:
            params = {
                "q": "collection:librivoxaudio",
                "fl": "identifier,title,creator,description,downloads,date,runtime",
                "sort": "downloads desc",
                "rows": limit,
                "output": "json"
            }
            
            response = await self.client.get(ARCHIVE_SEARCH_URL, params=params)
            response.raise_for_status()
            data = response.json()
            
            books = data.get("response", {}).get("docs", [])
            
            # Add cover URLs
            for book in books:
                book["cover_url"] = f"https://archive.org/services/img/{book.get('identifier', '')}"
                book["archive_url"] = f"{ARCHIVE_DETAILS_URL}/{book.get('identifier', '')}"
            
            return books
            
        except Exception as e:
            logger.error(f"Get popular books error: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to get popular books: {str(e)}")

# Initialize API client
librivox_api = LibriVoxAPI()

@router.get("/search")
async def search_audiobooks(
    q: Optional[str] = Query(None, description="General search query"),
    author: Optional[str] = Query(None, description="Author name"),
    title: Optional[str] = Query(None, description="Book title"),
    limit: int = Query(20, ge=1, le=100, description="Number of results to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination")
):
    """Search LibriVox audiobooks"""
    return await librivox_api.search_audiobooks(
        query=q or "",
        author=author or "",
        title=title or "",
        limit=limit,
        offset=offset
    )

@router.get("/popular")
async def get_popular_audiobooks(
    limit: int = Query(10, ge=1, le=50, description="Number of popular books to return")
):
    """Get popular LibriVox audiobooks"""
    return await librivox_api.get_popular_books(limit=limit)

@router.get("/book/{identifier}")
async def get_book_details(identifier: str):
    """Get detailed information about a specific audiobook"""
    return await librivox_api.get_book_details(identifier)

@router.get("/download/{identifier}/{filename}")
async def download_audio_file(identifier: str, filename: str):
    """Stream/download audio file from LibriVox"""
    
    download_url = f"{ARCHIVE_DOWNLOAD_URL}/{identifier}/{filename}"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(download_url, timeout=60.0)
            response.raise_for_status()
            
            # Get content type
            content_type = response.headers.get("content-type", "audio/mpeg")
            
            # Stream the file
            def iter_content():
                for chunk in response.iter_bytes(chunk_size=8192):
                    yield chunk
            
            return StreamingResponse(
                iter_content(),
                media_type=content_type,
                headers={
                    "Content-Disposition": f"attachment; filename={filename}",
                    "Content-Length": response.headers.get("content-length", "")
                }
            )
            
    except Exception as e:
        logger.error(f"Download error: {e}")
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")

@router.get("/stream/{identifier}/{filename}")
async def stream_audio_file(identifier: str, filename: str):
    """Stream audio file for online listening"""
    
    download_url = f"{ARCHIVE_DOWNLOAD_URL}/{identifier}/{filename}"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(download_url, timeout=60.0)
            response.raise_for_status()
            
            # Get content type
            content_type = response.headers.get("content-type", "audio/mpeg")
            
            # Stream the file
            def iter_content():
                for chunk in response.iter_bytes(chunk_size=8192):
                    yield chunk
            
            return StreamingResponse(
                iter_content(),
                media_type=content_type,
                headers={
                    "Accept-Ranges": "bytes",
                    "Content-Length": response.headers.get("content-length", "")
                }
            )
            
    except Exception as e:
        logger.error(f"Stream error: {e}")
        raise HTTPException(status_code=500, detail=f"Stream failed: {str(e)}")

@router.get("/categories")
async def get_categories():
    """Get available categories/subjects for LibriVox audiobooks"""
    
    try:
        # Get books with subjects to build category list
        params = {
            "q": "collection:librivoxaudio",
            "fl": "subject",
            "rows": 1000,
            "output": "json"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(ARCHIVE_SEARCH_URL, params=params)
            response.raise_for_status()
            data = response.json()
            
            books = data.get("response", {}).get("docs", [])
            
            # Extract unique subjects
            subjects = set()
            for book in books:
                book_subjects = book.get("subject", [])
                if isinstance(book_subjects, list):
                    subjects.update(book_subjects)
                elif isinstance(book_subjects, str):
                    subjects.add(book_subjects)
            
            # Filter and sort subjects
            filtered_subjects = [s for s in subjects if s and len(s) > 2]
            filtered_subjects.sort()
            
            return {"categories": filtered_subjects[:50]}  # Return top 50 categories
            
    except Exception as e:
        logger.error(f"Get categories error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get categories: {str(e)}")

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "LibriVox API"} 