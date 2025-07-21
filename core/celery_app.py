from celery import Celery
from core.config import get_settings
import os
import dotenv

dotenv.load_dotenv()

CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL")
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND")


celery_app = Celery(
    "worker",
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND,
    include=["assistance.tasks"],
)

celery_app.conf.update(
    task_track_started=True,
) 