"""
CivicLens User Schemas — Data Validation & Response Serialization
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    email: EmailStr = Field(..., description="User email address")
    username: str = Field(..., min_length=3, max_length=50, description="Unique username")
    password: str = Field(..., min_length=6, description="User password (min 6 chars)")
    full_name: str = Field(..., min_length=2, max_length=100, description="User full name (required)")


class UserLogin(BaseModel):
    username_or_email: str = Field(..., description="Username or email address")
    password: str = Field(..., description="User password")


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: str
    role: str = "user"
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
