"""Database core: engine, session factory, and async session management."""
from contextlib import asynccontextmanager
from typing import AsyncGenerator, List, Optional
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, Text, String, Integer, DateTime, Float, Boolean
import uuid
from datetime import datetime
from dotenv import load_dotenv
import os


# from pydantic import BaseModel

# Moved from core/user_db.py to break circular import
class User(SQLModel, table=True):
    __tablename__ = "users"
    # strikes: int = Field(default=0, nullable=True)
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    username: str = Field(unique=True, index=True, nullable=False)
    email: str = Field(unique=True, index=True, nullable=False)
    hashed_password: Optional[str] = Field(nullable=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    total_study_time: int = Field(default=0, nullable=True)
    study_streak_days: int = Field(default=0, nullable=True)

    chats: List["Chat"] = Relationship(back_populates="user")
    book_chats: List["BookChat"] = Relationship(back_populates="user")
    audio_chats: List["AudioChat"] = Relationship(back_populates="user") # Новая связь
    notes: List["Note"] = Relationship(back_populates="user")
    subscriptions: List["Subscription"] = Relationship(back_populates="user")

load_dotenv()


DATABASE_URL = "postgresql+psycopg://postgres:password@127.0.0.1:5432/learnindb"



engine = create_async_engine(DATABASE_URL, echo=True, future=True)

class Document(SQLModel, table=True):
    file_id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    filename: str
    user_id: str = Field(foreign_key="users.id", index=True)
    upload_time: datetime = Field(default_factory=datetime.utcnow)
    status: str = Field(default="uploaded")
    processing_status: str = Field(default="pending")
    total_pages: Optional[int] = None
    total_chunks: Optional[int] = None
    file_type: str
    file_path: str
    full_text_path: Optional[str] = None
    processed_from_page: Optional[int] = None
    processed_to_page: Optional[int] = None
    book_chats: List["BookChat"] = Relationship(back_populates="document")
    audio_chats: List["AudioChat"] = Relationship(back_populates="document") # Новая связь
    qa_history: List["DocumentQA"] = Relationship(back_populates="document")

class DocumentQA(SQLModel, table=True):
    __tablename__ = "document_qa"
    id: int = Field(default=None, primary_key=True)
    file_id: str = Field(foreign_key="document.file_id")
    question: str
    answer: str
    sources: Optional[str] = None
    confidence: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    document: Document = Relationship(back_populates="qa_history")


class Notes(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    header: str
    text: str
    completed: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Note(SQLModel, table=True):
    __tablename__ = "structured_notes"
    id: int = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    chat_id: Optional[str] = Field(index=True, nullable=True)  # Remove foreign key constraint
    
    title: str
    meaning: str = Field(sa_column=Column(Text))
    association: str = Field(sa_column=Column(Text))
    personal_relevance: str = Field(sa_column=Column(Text))
    importance: str = Field(sa_column=Column(Text))
    implementation_plan: Optional[str] = Field(sa_column=Column(Text, nullable=True))
    user_question: Optional[str] = Field(sa_column=Column(Text, nullable=True))  # For voice message notes

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    user: "User" = Relationship(back_populates="notes")
    # Remove chat relationship since we now support multiple chat types


class Chat(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    name: str = Field(default="Новый чат")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    messages: List["Message"] = Relationship(back_populates="chat", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    user: User = Relationship(back_populates="chats")

class Message(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    chat_id: str = Field(foreign_key="chat.id")
    chat: Chat = Relationship(back_populates="messages")
    role: str
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class BookChat(SQLModel, table=True):
    __tablename__ = 'book_chat'
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    name: Optional[str] = None
    file_id: str = Field(foreign_key="document.file_id")
    messages: List["BookChatMessage"] = Relationship(back_populates="book_chat", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    document: Document = Relationship(back_populates="book_chats")
    user: User = Relationship(back_populates="book_chats")

class BookChatMessage(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    book_chat_id: str = Field(foreign_key="book_chat.id")
    book_chat: "BookChat" = Relationship(back_populates="messages")
    role: str
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Новые модели для аудио-чата
class AudioChat(SQLModel, table=True):
    __tablename__ = 'audio_chat'
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    name: Optional[str] = None
    file_id: str = Field(foreign_key="document.file_id") # Связь с Document, где хранится аудио
    created_at: datetime = Field(default_factory=datetime.utcnow)
    messages: List["AudioChatMessage"] = Relationship(back_populates="audio_chat", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    document: Document = Relationship(back_populates="audio_chats")
    user: User = Relationship(back_populates="audio_chats")

class AudioChatMessage(SQLModel, table=True):
    __tablename__ = 'audio_chat_message'
    id: int = Field(default=None, primary_key=True)
    audio_chat_id: str = Field(foreign_key="audio_chat.id")
    audio_chat: "AudioChat" = Relationship(back_populates="messages")
    role: str
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Subscription(SQLModel, table=True):
    __tablename__ = 'subscriptions'
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    plan_type: str = Field(default="free")  # free, basic, premium
    status: str = Field(default="active")  # active, cancelled, expired
    start_date: datetime = Field(default_factory=datetime.utcnow)
    end_date: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    user: "User" = Relationship(back_populates="subscriptions")

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

@asynccontextmanager
async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session