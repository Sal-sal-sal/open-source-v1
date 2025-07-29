"""
Project Gutenberg API integration for free e-books
Provides search, metadata, and download functionality for public domain books
"""

import httpx
import json
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse, StreamingResponse
from typing import List, Dict, Any, Optional
from urllib.parse import quote
import asyncio
import logging

router = APIRouter(prefix="/api/gutenberg", tags=["gutenberg"])

# Project Gutenberg API endpoints
GUTENDEX_API_URL = "https://gutendex.com"
GUTENDEX_BOOKS_URL = f"{GUTENDEX_API_URL}/books/"
GUTENDEX_BOOK_URL = f"{GUTENDEX_API_URL}/books"

logger = logging.getLogger(__name__)

class GutenbergAPI:
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0, follow_redirects=True)
    
    async def search_books(
        self, 
        query: str = "",
        author: str = "",
        title: str = "",
        language: str = "",
        subject: str = "",
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Search Project Gutenberg books using gutendex API"""
        
        # Build search query
        search_terms = []
        if query:
            search_terms.append(query)
        if author:
            search_terms.append(f'author:"{author}"')
        if title:
            search_terms.append(f'title:"{title}"')
        if language:
            search_terms.append(f'language:"{language}"')
        if subject:
            # Try different subject search strategies
            search_terms.append(f'subject:"{subject}"')
            # Also try broader search for subject terms
            search_terms.append(subject)
        
        # Combine search terms
        search_query = " ".join(search_terms) if search_terms else "*"
        
        logger.info(f"Searching with query: {search_query}")
        
        params = {
            "search": search_query,
            "page": offset // limit + 1
        }
        
        try:
            response = await self.client.get(GUTENDEX_BOOKS_URL, params=params)
            response.raise_for_status()
            data = response.json()
            
            # Process results
            books = data.get("results", [])
            processed_books = []
            
            for book in books:
                processed_book = {
                    "id": book.get("id"),
                    "title": book.get("title", ""),
                    "authors": [author.get("name", "") for author in book.get("authors", [])],
                    "languages": book.get("languages", []),
                    "subjects": book.get("subjects", []),
                    "download_count": book.get("download_count", 0),
                    "formats": book.get("formats", {}),
                    "bookshelves": book.get("bookshelves", []),
                    "media_type": book.get("media_type", ""),
                    "cover_url": self._get_cover_url(book),
                    "text_url": self._get_text_url(book),
                    "html_url": self._get_html_url(book),
                    "epub_url": self._get_epub_url(book),
                    "kindle_url": self._get_kindle_url(book)
                }
                processed_books.append(processed_book)
            
            logger.info(f"Successfully processed {len(processed_books)} books from search")
            
            return {
                "books": processed_books,
                "count": len(processed_books),
                "total": data.get("count", 0),
                "next": data.get("next"),
                "previous": data.get("previous")
            }
            
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error in Gutenberg search: {e.response.status_code} - {e.response.text}")
            raise HTTPException(status_code=500, detail=f"Search failed: HTTP {e.response.status_code}")
        except Exception as e:
            logger.error(f"Gutenberg search error: {e}")
            raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")
    
    async def get_book_details(self, book_id: int) -> Dict[str, Any]:
        """Get detailed information about a specific book"""
        
        try:
            response = await self.client.get(f"{GUTENDEX_BOOK_URL}/{book_id}")
            response.raise_for_status()
            book = response.json()
            
            return {
                "id": book.get("id"),
                "title": book.get("title", ""),
                "authors": [author.get("name", "") for author in book.get("authors", [])],
                "languages": book.get("languages", []),
                "subjects": book.get("subjects", []),
                "download_count": book.get("download_count", 0),
                "formats": book.get("formats", {}),
                "bookshelves": book.get("bookshelves", []),
                "media_type": book.get("media_type", ""),
                "cover_url": self._get_cover_url(book),
                "text_url": self._get_text_url(book),
                "html_url": self._get_html_url(book),
                "epub_url": self._get_epub_url(book),
                "kindle_url": self._get_kindle_url(book)
            }
            
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error in get book details: {e.response.status_code} - {e.response.text}")
            raise HTTPException(status_code=500, detail=f"Failed to get book details: HTTP {e.response.status_code}")
        except Exception as e:
            logger.error(f"Get book details error: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to get book details: {str(e)}")
    
    async def get_book_text(self, book_id: int) -> str:
        """Get the full text content of a book"""
        
        try:
            # First get book details to find text URL
            book_details = await self.get_book_details(book_id)
            text_url = book_details.get("text_url")
            
            if not text_url:
                # Try to construct URLs manually
                possible_urls = [
                    f"https://www.gutenberg.org/files/{book_id}/{book_id}-0.txt",
                    f"https://www.gutenberg.org/cache/epub/{book_id}/pg{book_id}.txt",
                    f"https://www.gutenberg.org/ebooks/{book_id}.txt.utf-8"
                ]
            else:
                possible_urls = [text_url]
            
            # Try each URL until one works
            for url in possible_urls:
                try:
                    logger.info(f"Trying to get text from: {url}")
                    response = await self.client.get(url)
                    response.raise_for_status()
                    text_content = response.text
                    
                    # Check if we got meaningful content
                    if len(text_content) > 1000:
                        logger.info(f"Successfully got text from {url}, length: {len(text_content)}")
                        return text_content
                    else:
                        logger.warning(f"Text too short from {url}: {len(text_content)} characters")
                        continue
                        
                except Exception as e:
                    logger.warning(f"Failed to get text from {url}: {e}")
                    continue
            
            # If all URLs failed, try to get HTML and extract text
            html_url = book_details.get("html_url")
            if html_url:
                try:
                    logger.info(f"Trying HTML format: {html_url}")
                    response = await self.client.get(html_url)
                    response.raise_for_status()
                    html_content = response.text
                    
                    # Enhanced HTML to text conversion
                    import re
                    
                    # Remove HTML tags but preserve some formatting
                    # First, replace common HTML entities
                    html_content = html_content.replace('&nbsp;', ' ')
                    html_content = html_content.replace('&amp;', '&')
                    html_content = html_content.replace('&lt;', '<')
                    html_content = html_content.replace('&gt;', '>')
                    html_content = html_content.replace('&quot;', '"')
                    html_content = html_content.replace('&#39;', "'")
                    
                    # Remove script and style tags completely
                    html_content = re.sub(r'<script[^>]*>.*?</script>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
                    html_content = re.sub(r'<style[^>]*>.*?</style>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
                    
                    # Replace some HTML tags with appropriate text formatting
                    html_content = re.sub(r'<br\s*/?>', '\n', html_content, flags=re.IGNORECASE)
                    html_content = re.sub(r'<p[^>]*>', '\n\n', html_content, flags=re.IGNORECASE)
                    html_content = re.sub(r'</p>', '\n', html_content, flags=re.IGNORECASE)
                    html_content = re.sub(r'<h[1-6][^>]*>', '\n\n', html_content, flags=re.IGNORECASE)
                    html_content = re.sub(r'</h[1-6]>', '\n', html_content, flags=re.IGNORECASE)
                    html_content = re.sub(r'<div[^>]*>', '\n', html_content, flags=re.IGNORECASE)
                    html_content = re.sub(r'</div>', '\n', html_content, flags=re.IGNORECASE)
                    
                    # Remove all remaining HTML tags
                    html_content = re.sub(r'<[^>]+>', '', html_content)
                    
                    # Clean up whitespace
                    html_content = re.sub(r'\s+', ' ', html_content)
                    html_content = re.sub(r'\n\s*\n', '\n\n', html_content)
                    text_content = html_content.strip()
                    
                    if len(text_content) > 1000:
                        logger.info(f"Successfully extracted text from HTML, length: {len(text_content)}")
                        return text_content
                        
                except Exception as e:
                    logger.warning(f"Failed to get HTML text: {e}")
            
            raise HTTPException(status_code=404, detail="Text format not available for this book")
            
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error in get book text: {e.response.status_code} - {e.response.text}")
            raise HTTPException(status_code=500, detail=f"Failed to get book text: HTTP {e.response.status_code}")
        except Exception as e:
            logger.error(f"Get book text error: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to get book text: {str(e)}")
    
    async def get_popular_books(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get popular Project Gutenberg books"""
        
        try:
            # Get first page of books (they are typically sorted by popularity)
            params = {
                "page": 1
            }
            
            response = await self.client.get(GUTENDEX_BOOKS_URL, params=params)
            response.raise_for_status()
            data = response.json()
            
            books = data.get("results", [])[:limit]
            processed_books = []
            
            for book in books:
                processed_book = {
                    "id": book.get("id"),
                    "title": book.get("title", ""),
                    "authors": [author.get("name", "") for author in book.get("authors", [])],
                    "languages": book.get("languages", []),
                    "subjects": book.get("subjects", []),
                    "download_count": book.get("download_count", 0),
                    "formats": book.get("formats", {}),
                    "bookshelves": book.get("bookshelves", []),
                    "media_type": book.get("media_type", ""),
                    "cover_url": self._get_cover_url(book),
                    "text_url": self._get_text_url(book),
                    "html_url": self._get_html_url(book),
                    "epub_url": self._get_epub_url(book),
                    "kindle_url": self._get_kindle_url(book)
                }
                processed_books.append(processed_book)
            
            logger.info(f"Successfully loaded {len(processed_books)} popular books")
            return processed_books
            
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error in get popular books: {e.response.status_code} - {e.response.text}")
            raise HTTPException(status_code=500, detail=f"Failed to get popular books: HTTP {e.response.status_code}")
        except Exception as e:
            logger.error(f"Get popular books error: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to get popular books: {str(e)}")
    
    def _get_cover_url(self, book: Dict[str, Any]) -> Optional[str]:
        """Extract cover URL from book formats"""
        formats = book.get("formats", {})
        return formats.get("image/jpeg") or formats.get("image/png")
    
    def _get_text_url(self, book: Dict[str, Any]) -> Optional[str]:
        """Extract plain text URL from book formats"""
        formats = book.get("formats", {})
        
        # Try different text formats in order of preference
        text_formats = [
            "text/plain; charset=utf-8",
            "text/plain",
            "text/html; charset=utf-8",
            "text/html",
            "application/epub+zip",
            "application/x-mobipocket-ebook"
        ]
        
        for format_type in text_formats:
            if format_type in formats:
                return formats[format_type]
        
        # If no text format found, try to construct a URL from the book ID
        book_id = book.get("id")
        if book_id:
            # Try different URL patterns for text
            possible_urls = [
                f"https://www.gutenberg.org/files/{book_id}/{book_id}-0.txt",
                f"https://www.gutenberg.org/cache/epub/{book_id}/pg{book_id}.txt",
                f"https://www.gutenberg.org/ebooks/{book_id}.txt.utf-8"
            ]
            return possible_urls[0]  # Return the first one as fallback
        
        return None
    
    def _get_html_url(self, book: Dict[str, Any]) -> Optional[str]:
        """Extract HTML URL from book formats"""
        formats = book.get("formats", {})
        return formats.get("text/html; charset=utf-8") or formats.get("text/html")
    
    def _get_epub_url(self, book: Dict[str, Any]) -> Optional[str]:
        """Extract EPUB URL from book formats"""
        formats = book.get("formats", {})
        return formats.get("application/epub+zip")
    
    def _get_kindle_url(self, book: Dict[str, Any]) -> Optional[str]:
        """Extract Kindle URL from book formats"""
        formats = book.get("formats", {})
        return formats.get("application/x-mobipocket-ebook")

# Initialize API client
gutenberg_api = GutenbergAPI()

@router.get("/search")
async def search_books(
    q: str = Query("", description="Search query"),
    author: str = Query("", description="Author name"),
    title: str = Query("", description="Book title"),
    language: str = Query("", description="Language code"),
    subject: str = Query("", description="Subject"),
    limit: int = Query(20, ge=1, le=50, description="Number of results"),
    offset: int = Query(0, ge=0, description="Offset for pagination")
):
    """Search Project Gutenberg books"""
    return await gutenberg_api.search_books(
        query=q,
        author=author,
        title=title,
        language=language,
        subject=subject,
        limit=limit,
        offset=offset
    )

@router.get("/book/{book_id}")
async def get_book(book_id: int):
    """Get detailed information about a specific book"""
    return await gutenberg_api.get_book_details(book_id)

@router.get("/text/{book_id}")
async def get_book_text(book_id: int):
    """Get the full text content of a book"""
    text_content = await gutenberg_api.get_book_text(book_id)
    
    # Create both cleaned and HTML versions
    import re
    
    # Clean version for PDF
    cleaned_text = text_content
    # Replace HTML entities
    entities = {
        '&nbsp;': ' ',
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&apos;': "'",
        '&mdash;': '—',
        '&ndash;': '–',
        '&hellip;': '...',
        '&ldquo;': '"',
        '&rdquo;': '"',
        '&lsquo;': ''',
        '&rsquo;': '''
    }
    
    for entity, replacement in entities.items():
        cleaned_text = cleaned_text.replace(entity, replacement)
    
    # Remove script and style tags
    cleaned_text = re.sub(r'<script[^>]*>.*?</script>', '', cleaned_text, flags=re.DOTALL | re.IGNORECASE)
    cleaned_text = re.sub(r'<style[^>]*>.*?</style>', '', cleaned_text, flags=re.DOTALL | re.IGNORECASE)
    
    # Replace HTML tags with formatting
    cleaned_text = re.sub(r'<br\s*/?>', '\n', cleaned_text, flags=re.IGNORECASE)
    cleaned_text = re.sub(r'<p[^>]*>', '\n\n', cleaned_text, flags=re.IGNORECASE)
    cleaned_text = re.sub(r'</p>', '\n', cleaned_text, flags=re.IGNORECASE)
    cleaned_text = re.sub(r'<h[1-6][^>]*>', '\n\n', cleaned_text, flags=re.IGNORECASE)
    cleaned_text = re.sub(r'</h[1-6]>', '\n', cleaned_text, flags=re.IGNORECASE)
    cleaned_text = re.sub(r'<div[^>]*>', '\n', cleaned_text, flags=re.IGNORECASE)
    cleaned_text = re.sub(r'</div>', '\n', cleaned_text, flags=re.IGNORECASE)
    cleaned_text = re.sub(r'<li[^>]*>', '\n• ', cleaned_text, flags=re.IGNORECASE)
    cleaned_text = re.sub(r'</li>', '\n', cleaned_text, flags=re.IGNORECASE)
    cleaned_text = re.sub(r'<ul[^>]*>', '\n', cleaned_text, flags=re.IGNORECASE)
    cleaned_text = re.sub(r'</ul>', '\n', cleaned_text, flags=re.IGNORECASE)
    cleaned_text = re.sub(r'<ol[^>]*>', '\n', cleaned_text, flags=re.IGNORECASE)
    cleaned_text = re.sub(r'</ol>', '\n', cleaned_text, flags=re.IGNORECASE)
    cleaned_text = re.sub(r'<blockquote[^>]*>', '\n\n"', cleaned_text, flags=re.IGNORECASE)
    cleaned_text = re.sub(r'</blockquote>', '"\n\n', cleaned_text, flags=re.IGNORECASE)
    
    # Remove remaining HTML tags
    cleaned_text = re.sub(r'<[^>]+>', '', cleaned_text)
    
    # Clean up whitespace
    cleaned_text = re.sub(r'\n\s*\n', '\n\n', cleaned_text)
    cleaned_text = re.sub(r'\s+', ' ', cleaned_text)
    cleaned_text = re.sub(r'\n\s+', '\n', cleaned_text)
    cleaned_text = re.sub(r'\s+\n', '\n', cleaned_text)
    cleaned_text = cleaned_text.strip()
    
    return {
        "book_id": book_id,
        "text": cleaned_text,
        "html_text": text_content,  # Original HTML for reference
        "length": len(cleaned_text),
        "source": "Project Gutenberg"
    }

@router.post("/convert-to-audio/{book_id}")
async def convert_book_to_audio(book_id: int):
    """Convert a book to audio using text-to-speech"""
    try:
        # Get the book text
        text_content = await gutenberg_api.get_book_text(book_id)
        book_details = await gutenberg_api.get_book_details(book_id)
        
        if len(text_content) < 100:
            raise HTTPException(status_code=400, detail="Book text is too short for conversion")
        
        # Import the PDF to audio converter
        from assistance.pdf_to_audio import PDFToAudioConverter
        
        # Create a temporary text file with UTF-8 encoding
        import tempfile
        import os
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8') as temp_file:
            temp_file.write(text_content)
            temp_file_path = temp_file.name
        
        try:
            # Convert text to audio
            converter = PDFToAudioConverter()
            
            # Create a mock file object for the converter with UTF-8 encoding
            class MockFile:
                def __init__(self, content, filename):
                    self.content = content
                    self.filename = filename
                
                def read(self):
                    return self.content.encode('utf-8')
            
            mock_file = MockFile(text_content, f"gutenberg_book_{book_id}.txt")
            
            # Convert to audio
            audio_result = await converter.convert_text_to_audio(
                text_content,
                filename=f"gutenberg_book_{book_id}",
                title=book_details.get("title", f"Book {book_id}"),
                author=", ".join(book_details.get("authors", []))
            )
            
            return {
                "book_id": book_id,
                "title": book_details.get("title", ""),
                "authors": book_details.get("authors", []),
                "audio_url": audio_result.get("audio_url"),
                "duration": audio_result.get("duration"),
                "file_size": audio_result.get("file_size"),
                "text_length": len(text_content),
                "status": "success"
            }
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except Exception as e:
        logger.error(f"Convert to audio error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to convert book to audio: {str(e)}")

@router.get("/popular")
async def get_popular_books(limit: int = Query(10, ge=1, le=50, description="Number of popular books")):
    """Get popular Project Gutenberg books"""
    return await gutenberg_api.get_popular_books(limit)

@router.get("/categories")
async def get_categories():
    """Get available book categories/subjects"""
    # Common Project Gutenberg categories
    categories = [
        "Fiction", "Non-Fiction", "Poetry", "Drama", "History", 
        "Philosophy", "Science", "Religion", "Biography", "Travel",
        "Adventure", "Romance", "Mystery", "Fantasy", "Children's Literature",
        "Classic Literature", "Modern Literature", "Ancient Literature"
    ]
    return {"categories": categories}