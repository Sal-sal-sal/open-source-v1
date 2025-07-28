"""
Simplified FastAPI server for LibriVox API only
No database required - just proxies requests to Archive.org
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Import only LibriVox router
from api.routes.librivox import router as librivox_router

# Create FastAPI app without database dependencies
app = FastAPI(
    title="LibriVox API Server", 
    version="1.0.0",
    description="Simple proxy server for LibriVox audiobooks"
)

# CORS middleware for frontend
origins = [
    "http://localhost:5173",
    "http://localhost:4173", 
    "http://127.0.0.1:5173",
    "http://127.0.0.1:4173",
    "http://10.68.243.54:5173",   # ваш IP для мобильного доступа
    "https://learntug.ink"        # прод-домен
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include only LibriVox router
app.include_router(librivox_router)

@app.get("/")
async def root():
    return {
        "message": "LibriVox API Server", 
        "status": "running",
        "endpoints": [
            "/api/librivox/search",
            "/api/librivox/popular", 
            "/api/librivox/book/{identifier}",
            "/api/librivox/stream/{identifier}/{filename}",
            "/api/librivox/download/{identifier}/{filename}",
            "/api/librivox/categories",
            "/api/librivox/health"
        ]
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "LibriVox API Server"}

if __name__ == "__main__":
    print("🎧 Starting LibriVox API Server...")
    print("📚 No database required - just LibriVox integration!")
    print("🌐 Available at: http://localhost:8000")
    print("📖 API docs: http://localhost:8000/docs")
    
    uvicorn.run(
        "main_librivox:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 