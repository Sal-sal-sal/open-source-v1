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

class GoogleLoginRequest(BaseModel):
    token: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

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
        return TokenResponse(access_token=access_token)

@router.post("/google", response_model=TokenResponse)
async def google_login(
    request: GoogleLoginRequest
):
    settings = get_settings()
    async with get_async_session() as session:
        try:
            id_info = id_token.verify_oauth2_token(
                request.token, requests.Request(), settings.google_client_id
            )
            email = id_info["email"]
            username = email.split("@")[0]

            user = await get_user_by_email(session, email)
            if not user:
                # Create a new user if one doesn't exist
                user_id = await create_user(session, username, email)
                user = await get_user_by_username(session, username)

            access_token = create_access_token(data={"sub": user.username})
            return TokenResponse(access_token=access_token)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Google token",
            )