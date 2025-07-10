"""PDF/text extraction utilities.

Теперь используем pdfplumber, который надёжнее вытягивает текст со всех страниц,
включая многостраничные документы с разными шрифтами и колонтитулами.
"""

from __future__ import annotations

import io
from typing import List

import pdfplumber  # type: ignore


def extract_text_from_pdf(pdf_bytes: bytes, from_page: int | None = None, to_page: int | None = None) -> str:
    """Extract text from *all* pages of a PDF using pdfplumber.

    Args:
        pdf_bytes: Raw PDF file bytes.
        from_page: Start page number (inclusive)
        to_page: End page number (inclusive)

    Returns:
        A single string with newline-separated page texts.
    """
    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            pages = pdf.pages
            if from_page is not None and to_page is not None:
                pages = pages[from_page-1:to_page]
            texts = [(page.extract_text() or "") for page in pages]
        combined = "\n".join(texts).strip()
        if not combined:
            raise ValueError("No extractable text found in PDF (might be a scan)")
        return combined
    except Exception as exc:
        raise ValueError(f"Error extracting text from PDF: {exc}") from exc

def extract_text_from_pdf_by_page(pdf_bytes: bytes) -> List[str]:
    """
    Extracts text from each page of a PDF and returns a list of strings.

    Args:
        pdf_bytes: Raw PDF file bytes.

    Returns:
        A list where each element is the text of a page.
    """
    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            page_texts = [(page.extract_text() or "") for page in pdf.pages]
        if not any(page_texts):
            raise ValueError("No extractable text found in PDF (might be a scan)")
        return page_texts
    except Exception as exc:
        raise ValueError(f"Error extracting text from PDF: {exc}") from exc

def get_pdf_page_count(pdf_bytes: bytes) -> int:
    """
    Returns the number of pages in a PDF file.
    
    Args:
        pdf_bytes: Raw PDF file bytes.
        
    Returns:
        The total number of pages.
    """
    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            return len(pdf.pages)
    except Exception as exc:
        raise ValueError(f"Error reading PDF for page count: {exc}") from exc

def extract_text_from_txt(txt_file: bytes) -> str:
    """
    Extract text from a plain text file.
    
    Args:
        txt_file: Text file content as bytes
        
    Returns:
        Decoded text as a string
    """
    try:
        # Try different encodings
        encodings = ['utf-8', 'latin-1', 'cp1252']
        
        for encoding in encodings:
            try:
                return txt_file.decode(encoding)
            except UnicodeDecodeError:
                continue
                
        raise ValueError("Unable to decode text file with common encodings")
    except Exception as e:
        raise ValueError(f"Error reading text file: {str(e)}") 