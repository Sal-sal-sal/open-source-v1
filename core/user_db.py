"""User model and async CRUD helpers."""

import uuid
from datetime import datetime, date, timedelta
from typing import Optional, List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import Field, SQLModel, Relationship
from core.db import Chat, BookChat, User

# Removed User model definition from here as it's now in core/db.py

# ----------------- Async CRUD ----------------- #

async def create_user(
    session: AsyncSession, username: str, email: str, hashed_password: Optional[str] = None
) -> str:
    """Create a new user and return its UUID."""
        # Check uniqueness
    result = await session.execute(select(User).where(User.username == username))
    if result.scalar_one_or_none():
            raise ValueError("Username already taken")

    result = await session.execute(select(User).where(User.email == email))
    if result.scalar_one_or_none():
        raise ValueError("Email already registered")

    user = User(username=username, email=email, hashed_password=hashed_password)
    session.add(user)
    await session.commit()
    return user.id


async def get_user_by_username(session: AsyncSession, username: str) -> Optional[User]:
    result = await session.execute(select(User).where(User.username == username))
    return result.scalar_one_or_none()

async def get_user_by_email(session: AsyncSession, email: str) -> Optional[User]:
    result = await session.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()

async def update_user_study_time(session: AsyncSession, user: User, minutes_to_add: int) -> User:
    """Updates user's study time and streak."""
    
    today = date.today()
    
    # Обновляем общее время обучения
    user.total_study_time += minutes_to_add

    # Логика обновления стрика
    if user.last_study_date:
        # Если последнее обучение было вчера, увеличиваем стрик
        if user.last_study_date == today - timedelta(days=1):
            user.study_streak_days += 1
        # Если последнее обучение было не сегодня и не вчера, сбрасываем стрик
        elif user.last_study_date < today - timedelta(days=1):
            user.study_streak_days = 1
        # Если обучение в тот же день, стрик не меняется
    else:
        # Если это первое обучение, начинаем стрик с 1
        user.study_streak_days = 1
        
    user.last_study_date = today
    
    session.add(user)
    await session.commit()
    await session.refresh(user)
    
    return user
