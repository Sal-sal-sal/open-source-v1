from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session
from pydantic import BaseModel, EmailStr
from google.oauth2 import id_token
from google.auth.transport import requests

from core.auth_utils import create_access_token, verify_password, hash_password
from core.user_db import get_user_by_username, create_user, get_user_by_email
from core.db import get_async_session
from core.config import get_settings

router = APIRouter(prefix="/auth", tags=["auth"])

class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    is_new_user: bool = False

class GoogleLoginRequest(BaseModel):
    token: str

@router.post("/register", status_code=201)
async def register(
    user_in: UserRegister
):
    async with get_async_session() as session:
        user = await get_user_by_email(session, user_in.email)
        if user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        user = await get_user_by_username(session, user_in.username)
        if user:
            raise HTTPException(status_code=400, detail="Username already taken")

        hashed_password = hash_password(user_in.password)
        await create_user(session, user_in.username, user_in.email, hashed_password)
        
        # Note: Frontend will handle the analytics tracking for registration
        # Backend can't directly call gtag, but we can log for server-side analytics
        print(f"User registered: {user_in.email}")  # Server-side logging
        
        return {"message": "User created successfully"}

@router.post("/token", response_model=TokenResponse)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends()
):
    async with get_async_session() as session:
        user = await get_user_by_username(session, form_data.username)
        if not user or not user.hashed_password or not verify_password(form_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        access_token = create_access_token(data={"sub": user.username})
        
        # Note: Frontend will handle the analytics tracking for login
        print(f"User logged in: {user.username}")  # Server-side logging
        
        return TokenResponse(access_token=access_token)

@router.post("/google", response_model=TokenResponse)
async def google_login(
    request: GoogleLoginRequest
):
    settings = get_settings()
    
    if not settings.google_client_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth not configured"
        )
    
    async with get_async_session() as session:
        try:
            # Verify the Google token
            id_info = id_token.verify_oauth2_token(
                request.token, requests.Request(), settings.google_client_id
            )
            
            email = id_info["email"]
            username = email.split("@")[0]
            is_new_user = False

            # Check if user exists
            user = await get_user_by_email(session, email)
            if not user:
                # Create a new user if one doesn't exist
                try:
                    user_id = await create_user(session, username, email)
                    user = await get_user_by_username(session, username)
                    is_new_user = True
                    
                    # Note: Frontend will handle the analytics tracking for Google registration
                    print(f"User registered via Google: {email}")  # Server-side logging
                except ValueError as e:
                    # Handle username conflict
                    if "Username already taken" in str(e):
                        # Try with a different username
                        import uuid
                        username = f"{username}_{str(uuid.uuid4())[:8]}"
                        user_id = await create_user(session, username, email)
                        user = await get_user_by_username(session, username)
                        is_new_user = True
                        print(f"User registered via Google with modified username: {email} -> {username}")
                    else:
                        raise e
            else:
                # Note: Frontend will handle the analytics tracking for Google login
                print(f"User logged in via Google: {user.username}")  # Server-side logging

            access_token = create_access_token(data={"sub": user.username})
            
            return TokenResponse(
                access_token=access_token,
                is_new_user=is_new_user
            )
            
        except ValueError as e:
            print(f"Google token verification failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Google token",
            )
        except Exception as e:
            print(f"Unexpected error during Google login: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Authentication failed",
            )