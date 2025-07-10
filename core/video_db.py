from datetime import datetime
import uuid
from typing import Optional
from sqlmodel import Field, SQLModel
from sqlalchemy import Column, LargeBinary

from .db import get_async_session


class Video(SQLModel, table=True):
    """Binary video blob associated with generation prompt/task."""

    __tablename__ = "videos"

    uuid: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    prompt: str
    data: bytes = Field(sa_column=Column(LargeBinary))
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ---------------- CRUD helpers ---------------- #

async def save_video_record(prompt: str, video_bytes: bytes) -> str:
    """Persist a new generated video and return its UUID."""
    video_uuid = str(uuid.uuid4())
    async with get_async_session() as session:
        vid = Video(uuid=video_uuid, prompt=prompt, data=video_bytes)
        session.add(vid)
        await session.commit()
    return video_uuid


async def load_video_bytes(uuid_str: str) -> Optional[bytes]:
    """Return raw bytes of stored video by its UUID, or None if missing."""
    async with get_async_session() as session:
        vid = await session.get(Video, uuid_str)
        if vid:
            return vid.data
        return None 