"""Image-related database model and helper functions."""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Column, LargeBinary
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import Field, SQLModel


class Image(SQLModel, table=True):
    __tablename__ = "images"

    uuid: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    prompt: str
    data: bytes = Field(sa_column=Column(LargeBinary))
    created_at: datetime = Field(default_factory=datetime.utcnow)



# ---------------- CRUD helpers ---------------- #

async def save_image_record(session: AsyncSession, prompt: str, image_bytes: bytes) -> str:
    image_uuid = str(uuid.uuid4())
    img = Image(uuid=image_uuid, prompt=prompt, data=image_bytes)
    session.add(img)
    await session.commit()
    return image_uuid


async def load_image_bytes(session: AsyncSession, uuid_str: str) -> Optional[bytes]:
    img = await session.get(Image, uuid_str)
    if img:
        return img.data
    return None 