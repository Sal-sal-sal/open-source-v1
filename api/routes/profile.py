from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession # Используем асинхронную сессию
from core.auth_utils import get_current_user
from core.db import get_async_session, User # Импортируем User из core.db
from core.models import UserInfo as UserProfileResponse # Profile остается в core.models
from core.user_db import update_user_study_time # Импортируем новую функцию
from pydantic import BaseModel

router = APIRouter(prefix="/api/profile", tags=["profile"])


class StudyTimeRequest(BaseModel):
    minutes: int


@router.get("", response_model=UserProfileResponse)
async def get_user_profile(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
):
    """
    Fetches the profile information for the currently authenticated user.
    """
    return UserProfileResponse(
        username=current_user.username,
        total_study_time=current_user.total_study_time,
        study_streak_days=current_user.study_streak_days,
    )


@router.post("/study-time", response_model=UserProfileResponse)
async def update_study_time_endpoint(
    request: StudyTimeRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
):
    """
    Updates the total study time for the user and recalculates the study streak.
    """
    updated_user = await update_user_study_time(
        session=session, user=current_user, minutes_to_add=request.minutes
    )
    return UserProfileResponse(
        username=updated_user.username,
        total_study_time=updated_user.total_study_time,
        study_streak_days=updated_user.study_streak_days,
    ) 

