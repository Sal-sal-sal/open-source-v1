
import psycopg
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from core.db import init_db
# Routers are defined in api.routes package
from api.routes.chat import router as chat_router
from api.routes.images import router as images_router
from api.routes.auth import router as auth_router
from api.routes.video import router as video_router
from api.routes.upload import router as upload_router
from api.routes.file import router as file_router
from api.routes.ai_teacher import router as ai_teacher_router
from api.routes.notes import router as notes_router
from api.routes.book_chat import router as book_chat_router
from api.routes.book_chat_api import router as book_chat_api_router
from api.routes.history_notes import router as history_notes_router
from api.routes.search import router as search_router
from api.routes.tasks import router as tasks_router
from api.routes.profile import router as profile_router # Импортируем новый роутер

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Initializing database...")
    await init_db()
    print("Database initialized.")
    yield

app = FastAPI(title="Llama4SC API", version="0.1.0", lifespan=lifespan)

# Allow cross-origin requests from development frontends
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://74.249.178.56:5173",  # если используешь IP
    "https://learntug.ink"        # прод-домен
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    # expose_headers=["*"],
    # allow_origin_regex should be a string regex, we omit it.
)

# Include routers
app.include_router(chat_router)
app.include_router(images_router)
app.include_router(auth_router)
app.include_router(video_router) 
app.include_router(upload_router)
app.include_router(file_router)
app.include_router(ai_teacher_router, prefix="/api")
app.include_router(notes_router)
app.include_router(book_chat_router)
app.include_router(book_chat_api_router)
app.include_router(history_notes_router)
app.include_router(search_router) 
app.include_router(tasks_router) 
app.include_router(profile_router) # Регистрируем новый роутер
