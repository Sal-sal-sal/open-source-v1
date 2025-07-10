from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from core.image_db import load_image_bytes

router = APIRouter()


@router.get("/images/{uuid}", tags=["images"])
async def get_image(uuid: str):
    """Return stored generated image bytes."""
    data = load_image_bytes(uuid)
    if data is None:
        raise HTTPException(status_code=404, detail="Image not found")
    return StreamingResponse(iter([data]), media_type="image/jpeg") 