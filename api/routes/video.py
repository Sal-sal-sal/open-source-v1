from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, HttpUrl
from fastapi.responses import StreamingResponse

from assistance.summ.summarise import summarise_video
from core.chat_db import add_message, Message
from core.auth_utils import get_current_user, User
from core.video_db import load_video_bytes
from core.db import get_async_session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import desc

router = APIRouter()


class VideoSummaryRequest(BaseModel):
    chat_id: str
    url: HttpUrl


class VideoSummaryResponse(BaseModel):
    summary: str
    message: str


@router.post("/video/summary", response_model=VideoSummaryResponse, tags=["video"])
async def video_summary(body: VideoSummaryRequest, current_user: User = Depends(get_current_user)):
    async with get_async_session() as session:
        try:
            summary = summarise_video(str(body.url))
        except Exception as exc:
            raise HTTPException(status_code=400, detail=str(exc))

        sys_msg = (
            f"Вот краткое содержание видео, на основе которого ты теперь будешь отвечать: {summary}. "
            "Действуй как обычно."
        )
        await add_message(session, body.chat_id, current_user.id, "system", sys_msg)
        # Send summary to user chat
        await add_message(session, body.chat_id, current_user.id, "assistant", f"Сводка видео: {summary}")
        # Follow-up note
        follow_up = "Видео обработано. Можете задать вопрос по его содержанию."
        await add_message(session, body.chat_id, current_user.id, "assistant", follow_up)
        return VideoSummaryResponse(summary=summary, message=follow_up)


# Endpoint to retrieve the last saved video summary for a chat


@router.get("/video/summary/{chat_id}", response_model=VideoSummaryResponse, tags=["video"])
async def get_video_summary(chat_id: str, current_user: User = Depends(get_current_user)):
    async with get_async_session() as session:
        result = await session.execute(
            select(Message)
            .filter(Message.chat_id == chat_id, Message.role == "system")
            .order_by(desc(Message.created_at))
        )
        msg = result.scalar_one_or_none()
        if msg is None or msg.content is None or "Вот краткое содержание" not in msg.content:
            raise HTTPException(status_code=404, detail="Summary not found")

        return VideoSummaryResponse(summary=msg.content, message=msg.content)


@router.get("/videos/{uuid}", tags=["video"])
async def get_video(uuid: str):
    """Return stored generated video bytes."""
    data = load_video_bytes(uuid)
    if data is None:
        raise HTTPException(status_code=404, detail="Video not found")
    return StreamingResponse(iter([data]), media_type="video/mp4") 