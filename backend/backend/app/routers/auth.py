"""
CivicLens User Authentication & Role Authorization Router
Exposes /api/auth/register, /api/auth/login, /api/auth/me, and /api/auth/logout endpoints.
Includes get_current_user and require_admin backend authorization dependencies.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_auth_db
from app.schemas.user import UserRegister, UserLogin, UserResponse, TokenResponse
from app.services.auth_service import AuthService
from app.models.user import User

router = APIRouter(prefix="/api/auth", tags=["User Authentication"])


def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_auth_db)
) -> User:
    """Dependency to extract and verify current authenticated user from Bearer JWT token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required. Please log in."
        )

    token = authorization.split(" ")[1]
    payload = AuthService.decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token."
        )

    try:
        user_id = int(payload["sub"])
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token subject payload."
        )

    user = db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive."
        )

    return user


def require_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """Dependency enforcing that the authenticated user possesses role == 'admin'."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required. Access denied."
        )
    return current_user


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED, summary="Register new citizen account")
def register(
    payload: UserRegister,
    db: Session = Depends(get_auth_db)
):
    """Registers a new citizen account in PostgreSQL with hashed password and returns access token. Always sets role='user'."""
    user = AuthService.register_user(db, payload)
    access_token = AuthService.create_access_token(data={"sub": user.id, "email": user.email, "role": user.role})
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.post("/login", response_model=TokenResponse, summary="Login user")
def login(
    payload: UserLogin,
    db: Session = Depends(get_auth_db)
):
    """Authenticates user credentials against PostgreSQL and returns JWT access token."""
    user = AuthService.authenticate_user(db, payload.username_or_email, payload.password)
    access_token = AuthService.create_access_token(data={"sub": user.id, "email": user.email, "role": user.role})
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse, summary="Get current logged in user profile")
def get_me(
    current_user: User = Depends(get_current_user)
):
    """Returns profile information for the currently authenticated user."""
    return UserResponse.model_validate(current_user)


@router.post("/logout", summary="Logout current user session")
def logout():
    """Logs out the active session."""
    return {"message": "Session logged out successfully."}
