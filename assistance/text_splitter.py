"""
Text splitting utilities for chunking documents.
"""
from typing import List
from langchain.text_splitter import RecursiveCharacterTextSplitter

def split_text_into_chunks(
    text: str, 
    chunk_size: int = 500, 
    chunk_overlap: int = 50
) -> List[str]:
    """
    Split text into smaller chunks for processing.
    
    Args:
        text: The text to split
        chunk_size: Maximum size of each chunk
        chunk_overlap: Number of characters to overlap between chunks
        
    Returns:
        List of text chunks
    """
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        separators=["\n\n", "\n", ".", "!", "?", ";", ":", " ", ""]
    )
    
    chunks = text_splitter.split_text(text)
    
    # Filter out empty chunks
    chunks = [chunk.strip() for chunk in chunks if chunk.strip()]
    
    return chunks 