"""
API endpoints for YouTube video search and conversion to audio.
Handles video search, metadata extraction, and audio conversion.
"""

from fastapi import APIRouter, Form, HTTPException, Query
from fastapi.responses import JSONResponse
import os
import tempfile
import uuid
from datetime import datetime
from typing import Optional
import logging
import re
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# YouTube API imports
try:
    from googleapiclient.discovery import build
    from googleapiclient.errors import HttpError
    YOUTUBE_API_AVAILABLE = True
except ImportError:
    YOUTUBE_API_AVAILABLE = False
    logging.warning("YouTube API not available. Install google-api-python-client")

# Video processing imports
try:
    import yt_dlp
    YT_DLP_AVAILABLE = True
except ImportError:
    YT_DLP_AVAILABLE = False
    logging.warning("yt-dlp not available. Install yt-dlp")

from assistance.pdf_to_audio import PDFToAudioConverter

router = APIRouter(prefix="/api/video", tags=["Video"])

# YouTube API configuration
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
print(f"YouTube API Key loaded: {'Yes' if YOUTUBE_API_KEY else 'No'}")
if YOUTUBE_API_KEY:
    print(f"API Key starts with: {YOUTUBE_API_KEY[:10]}...")

def get_youtube_service():
    """Get YouTube API service."""
    if not YOUTUBE_API_AVAILABLE:
        raise HTTPException(status_code=500, detail="YouTube API not available")
    
    if not YOUTUBE_API_KEY:
        raise HTTPException(status_code=500, detail="YouTube API key not configured")
    
    return build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)

@router.get("/search")
async def search_videos(
    q: str = Query(..., description="Search query"),
    pageToken: Optional[str] = Query(None, description="Page token for pagination"),
    maxResults: int = Query(12, description="Maximum number of results")
):
    """Search YouTube videos."""
    try:
        youtube = get_youtube_service()
        
        # Search for videos
        search_response = youtube.search().list(
            q=q,
            part='id,snippet',
            maxResults=maxResults,
            type='video',
            pageToken=pageToken
        ).execute()
        
        # Get video IDs for detailed information
        video_ids = [item['id']['videoId'] for item in search_response['items']]
        
        if not video_ids:
            return JSONResponse(content={
                "items": [],
                "nextPageToken": search_response.get('nextPageToken'),
                "pageInfo": search_response.get('pageInfo', {})
            })
        
        # Get detailed video information
        videos_response = youtube.videos().list(
            part='snippet,statistics,contentDetails',
            id=','.join(video_ids)
        ).execute()
        
        # Format results
        videos = []
        for video in videos_response['items']:
            snippet = video['snippet']
            statistics = video.get('statistics', {})
            content_details = video.get('contentDetails', {})
            
            videos.append({
                "id": video['id'],
                "title": snippet['title'],
                "description": snippet['description'],
                "thumbnail": snippet['thumbnails']['high']['url'],
                "channelTitle": snippet['channelTitle'],
                "publishedAt": snippet['publishedAt'],
                "viewCount": statistics.get('viewCount', '0'),
                "likeCount": statistics.get('likeCount', '0'),
                "duration": content_details.get('duration', 'PT0S'),
                "url": f"https://www.youtube.com/watch?v={video['id']}"
            })
        
        return JSONResponse(content={
            "items": videos,
            "nextPageToken": search_response.get('nextPageToken'),
            "pageInfo": search_response.get('pageInfo', {})
        })
        
    except HttpError as e:
        logging.error(f"YouTube API error: {e}")
        raise HTTPException(status_code=500, detail=f"YouTube API error: {str(e)}")
    except Exception as e:
        logging.error(f"Error searching videos: {e}")
        raise HTTPException(status_code=500, detail=f"Error searching videos: {str(e)}")

@router.post("/convert-to-audio")
async def convert_video_to_audio(
    video_url: str = Form(..., description="YouTube video URL"),
    title: str = Form(..., description="Video title"),
    voice: str = Form("en-US-Standard-A", description="TTS voice"),
    speed: float = Form(1.0, description="Speech speed")
):
    """Convert YouTube video to audio."""
    if not YT_DLP_AVAILABLE:
        raise HTTPException(status_code=500, detail="yt-dlp not available")
    
    try:
        # Download video audio
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': '%(title)s.%(ext)s',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Get video info
            info = ydl.extract_info(video_url, download=False)
            video_title = info.get('title', title)
            
            # Download audio
            ydl.download([video_url])
        
        # Find the downloaded file
        audio_file = None
        for file in os.listdir('.'):
            if file.endswith('.mp3') and video_title.replace('/', '_').replace('\\', '_') in file:
                audio_file = file
                break
        
        if not audio_file:
            raise HTTPException(status_code=500, detail="Failed to download audio file")
        
        # Read audio content
        with open(audio_file, 'rb') as f:
            audio_content = f.read()
        
        # Clean up downloaded file
        try:
            os.remove(audio_file)
        except:
            pass
        
        # Upload to GCS
        converter = PDFToAudioConverter()
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_filename = f"video_audio_{timestamp}_{uuid.uuid4().hex[:8]}"
        gcs_filename = f"audio/{output_filename}.mp3"
        
        public_url = converter.upload_to_gcs(audio_content, gcs_filename)
        
        # Return results
        result = {
            "success": True,
            "public_url": public_url,
            "gcs_filename": gcs_filename,
            "audio_size_bytes": len(audio_content),
            "voice": voice,
            "voice_name": converter.voice_names.get(voice, "Unknown"),
            "speed": speed,
            "processing_time_seconds": 0.0,  # We don't track time for video conversion
            "duration": info.get('duration'),
            "video_title": video_title,
            "created_at": datetime.now().isoformat()
        }
        
        return JSONResponse(content=result)
        
    except Exception as e:
        logging.error(f"Error converting video to audio: {e}")
        return JSONResponse(
            content={
                "success": False,
                "error": str(e)
            },
            status_code=500
        )

@router.get("/info")
async def get_video_info(video_id: str = Query(..., description="YouTube video ID")):
    """Get detailed information about a YouTube video."""
    try:
        youtube = get_youtube_service()
        
        response = youtube.videos().list(
            part='snippet,statistics,contentDetails',
            id=video_id
        ).execute()
        
        if not response['items']:
            raise HTTPException(status_code=404, detail="Video not found")
        
        video = response['items'][0]
        snippet = video['snippet']
        statistics = video.get('statistics', {})
        content_details = video.get('contentDetails', {})
        
        return JSONResponse(content={
            "id": video['id'],
            "title": snippet['title'],
            "description": snippet['description'],
            "thumbnail": snippet['thumbnails']['high']['url'],
            "channelTitle": snippet['channelTitle'],
            "publishedAt": snippet['publishedAt'],
            "viewCount": statistics.get('viewCount', '0'),
            "likeCount": statistics.get('likeCount', '0'),
            "duration": content_details.get('duration', 'PT0S'),
            "url": f"https://www.youtube.com/watch?v={video['id']}"
        })
        
    except HttpError as e:
        logging.error(f"YouTube API error: {e}")
        raise HTTPException(status_code=500, detail=f"YouTube API error: {str(e)}")
    except Exception as e:
        logging.error(f"Error getting video info: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting video info: {str(e)}") 