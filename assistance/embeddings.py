"""
Embeddings service relying on OpenAI Embedding API. No local ML dependencies.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import List, Tuple

# Google Gemini embedding
import numpy as np
import os
import google.generativeai as genai  # type: ignore

from core.config import get_settings


@dataclass
class Document:
    """Represents a document chunk with its embedding."""

    id: str
    text: str
    embedding: np.ndarray


class EmbeddingsService:
    """Service that creates and searches embeddings via OpenAI API."""

    def __init__(self, model_name: str | None = None):
        settings = get_settings()
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        # default embedding model for Gemini
        self.model_name = model_name or "models/embedding-001"

        self.documents: List[Document] = []
        self.embeddings_matrix: np.ndarray | None = None  # shape: (N, dim)

    # ---------------------------------------------------------------------
    # Creation helpers
    # ---------------------------------------------------------------------
    def _gemini_embed(self, texts: List[str], task_type: str) -> List[List[float]]:
        """Call Gemini embedding model for each text."""
        vectors: List[List[float]] = []
        for t in texts:
            emb_resp = genai.embed_content(model=self.model_name, content=t, task_type=task_type)
            vectors.append(emb_resp["embedding"])
        return vectors

    def create_embeddings(self, texts: List[str]) -> List[np.ndarray]:
        """Create embeddings for list of texts via OpenAI."""
        vectors = self._gemini_embed(texts, task_type="retrieval_document")
        return [np.array(v, dtype=np.float32) for v in vectors]

    # ---------------------------------------------------------------------
    # Index helpers
    # ---------------------------------------------------------------------
    def build_index(self, documents: List[Document]):
        """Store documents and pre-build concatenated numpy matrix for fast search."""
        self.documents = documents
        self.embeddings_matrix = np.vstack([doc.embedding for doc in documents]).astype(
            np.float32
        )
        # Pre-compute row norms as 2-D column vector to keep broadcasting compatible
        self._doc_norms = np.linalg.norm(self.embeddings_matrix, axis=1, keepdims=True)
        self._doc_norms[self._doc_norms == 0] = 1e-10  # avoid div-by-zero

    # ---------------------------------------------------------------------
    # Search
    # ---------------------------------------------------------------------
    def search_similar(self, query: str, top_k: int = 3) -> List[Tuple[Document, float]]:
        if self.embeddings_matrix is None or not self.documents:
            return []

        query_vec = np.array(
            self._gemini_embed([query], task_type="retrieval_query")[0], dtype=np.float32
        )
        query_norm = np.linalg.norm(query_vec)
        if query_norm == 0:
            return []
        query_vec /= query_norm

        # Normalize matrix rows once
        normalized_matrix = self.embeddings_matrix / self._doc_norms
        # Cosine similarity = dot product as both sides are L2-normalised
        sims = normalized_matrix @ query_vec
        top_indices = sims.argsort()[-top_k:][::-1]
        results: List[Tuple[Document, float]] = [
            (self.documents[i], float(sims[i])) for i in top_indices
        ]
        return results 