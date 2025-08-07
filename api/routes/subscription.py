from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from core.auth_utils import get_current_user, User
from core.db import get_async_session, Subscription
from core.user_db import get_user_by_id

router = APIRouter(prefix="/subscription", tags=["subscription"])

class SubscriptionCreate(BaseModel):
    plan_type: str  # free, basic, premium

class SubscriptionResponse(BaseModel):
    id: str
    user_id: str
    plan_type: str
    status: str
    start_date: datetime
    end_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime

class SubscriptionPlan(BaseModel):
    plan_type: str
    name: str
    price: float
    features: List[str]
    limits: dict

@router.post("/create", response_model=SubscriptionResponse)
async def create_subscription(
    subscription_data: SubscriptionCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_async_session)
):
    """Create a new subscription for the current user"""
    
    # Check if user already has an active subscription
    existing_subscription = await session.execute(
        select(Subscription).where(
            Subscription.user_id == current_user.id,
            Subscription.status == "active"
        )
    )
    existing_subscription = existing_subscription.scalar_one_or_none()
    
    if existing_subscription:
        raise HTTPException(
            status_code=400,
            detail="User already has an active subscription"
        )
    
    # Create new subscription
    subscription = Subscription(
        user_id=current_user.id,
        plan_type=subscription_data.plan_type,
        status="active",
        start_date=datetime.utcnow(),
        end_date=datetime.utcnow() + timedelta(days=30) if subscription_data.plan_type != "free" else None
    )
    
    session.add(subscription)
    await session.commit()
    await session.refresh(subscription)
    
    return subscription

@router.get("/current", response_model=SubscriptionResponse)
async def get_current_subscription(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_async_session)
):
    """Get current user's active subscription"""
    
    subscription = await session.execute(
        select(Subscription).where(
            Subscription.user_id == current_user.id,
            Subscription.status == "active"
        )
    )
    subscription = subscription.scalar_one_or_none()
    
    if not subscription:
        # Return free subscription for users without active subscription
        return SubscriptionResponse(
            id="free",
            user_id=current_user.id,
            plan_type="free",
            status="active",
            start_date=current_user.created_at,
            end_date=None,
            created_at=current_user.created_at,
            updated_at=current_user.created_at
        )
    
    return subscription

@router.get("/plans", response_model=List[SubscriptionPlan])
async def get_subscription_plans():
    """Get available subscription plans"""
    
    plans = [
        SubscriptionPlan(
            plan_type="free",
            name="Free Plan",
            price=0.0,
            features=[
                "Basic chat functionality",
                "5 notes per month",
                "Basic file upload (10MB)",
                "Standard support"
            ],
            limits={
                "notes_per_month": 5,
                "file_size_mb": 10,
                "chat_messages_per_day": 50
            }
        ),
        SubscriptionPlan(
            plan_type="basic",
            name="Basic Plan",
            price=9.99,
            features=[
                "All Free features",
                "Unlimited notes",
                "Larger file uploads (50MB)",
                "Priority support",
                "Advanced analytics"
            ],
            limits={
                "notes_per_month": -1,  # unlimited
                "file_size_mb": 50,
                "chat_messages_per_day": 200
            }
        ),
        SubscriptionPlan(
            plan_type="premium",
            name="Premium Plan",
            price=19.99,
            features=[
                "All Basic features",
                "Unlimited file uploads (500MB)",
                "Unlimited chat messages",
                "Priority processing",
                "Advanced AI features",
                "24/7 support"
            ],
            limits={
                "notes_per_month": -1,  # unlimited
                "file_size_mb": 500,
                "chat_messages_per_day": -1  # unlimited
            }
        )
    ]
    
    return plans

@router.post("/cancel")
async def cancel_subscription(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_async_session)
):
    """Cancel current user's subscription"""
    
    subscription = await session.execute(
        select(Subscription).where(
            Subscription.user_id == current_user.id,
            Subscription.status == "active"
        )
    )
    subscription = subscription.scalar_one_or_none()
    
    if not subscription:
        raise HTTPException(
            status_code=404,
            detail="No active subscription found"
        )
    
    subscription.status = "cancelled"
    subscription.updated_at = datetime.utcnow()
    
    await session.commit()
    
    return {"message": "Subscription cancelled successfully"}

@router.post("/upgrade")
async def upgrade_subscription(
    subscription_data: SubscriptionCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_async_session)
):
    """Upgrade user's subscription"""
    
    # Cancel current subscription if exists
    current_subscription = await session.execute(
        select(Subscription).where(
            Subscription.user_id == current_user.id,
            Subscription.status == "active"
        )
    )
    current_subscription = current_subscription.scalar_one_or_none()
    
    if current_subscription:
        current_subscription.status = "cancelled"
        current_subscription.updated_at = datetime.utcnow()
    
    # Create new subscription
    subscription = Subscription(
        user_id=current_user.id,
        plan_type=subscription_data.plan_type,
        status="active",
        start_date=datetime.utcnow(),
        end_date=datetime.utcnow() + timedelta(days=30) if subscription_data.plan_type != "free" else None
    )
    
    session.add(subscription)
    await session.commit()
    await session.refresh(subscription)
    
    return {"message": "Subscription upgraded successfully", "subscription": subscription}

@router.get("/check-limits")
async def check_subscription_limits(
    feature: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_async_session)
):
    """Check if user can perform an action based on their subscription"""
    
    subscription = await session.execute(
        select(Subscription).where(
            Subscription.user_id == current_user.id,
            Subscription.status == "active"
        )
    )
    subscription = subscription.scalar_one_or_none()
    
    plan_type = subscription.plan_type if subscription else "free"
    
    # Define limits for each plan
    limits = {
        "free": {
            "notes_per_month": 5,
            "file_size_mb": 10,
            "chat_messages_per_day": 50
        },
        "basic": {
            "notes_per_month": -1,  # unlimited
            "file_size_mb": 50,
            "chat_messages_per_day": 200
        },
        "premium": {
            "notes_per_month": -1,  # unlimited
            "file_size_mb": 500,
            "chat_messages_per_day": -1  # unlimited
        }
    }
    
    current_limits = limits.get(plan_type, limits["free"])
    
    return {
        "plan_type": plan_type,
        "limits": current_limits,
        "can_perform": True  # For now, always allow (implement actual checking later)
    } 