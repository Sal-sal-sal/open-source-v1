"""Global application configuration accessible via get_settings().
Values берутся из переменных окружения или .env (если существует)."""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Main settings object loaded from environment variables / .env."""

    # --- OpenAI / Gemini API keys ---
    openai_api_key: str | None = None
    gemini_api_key: str | None = None

    # --- Google Custom Search ---
    google_api_key: str | None = None
    google_cx_id: str | None = None

    # --- Google OAuth ---
    google_client_id: str | None = None

    # --- File upload limits ---
    max_file_size_mb: int = 10
    allowed_extensions: List[str] = ["pdf", "txt"]

    # --- Embeddings / chunking ---
    embedding_model: str = "models/embedding-001"
    chunk_size: int = 1000
    chunk_overlap: int = 50

    # --- LLM context limit ---
    max_context_tokens: int = 12000

    # --- Storage ---
    upload_dir: str = "uploads"

    # Qdrant
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333
    qdrant_collection_name: str = "ai_tutor_collection"

    # Allow any extra env vars that are not explicitly defined to avoid validation errors
    model_config = {
        "extra": "allow"
    }


@lru_cache()
def get_settings() -> Settings:
    """Return a cached Settings instance."""
    return Settings() 