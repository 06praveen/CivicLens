"""
CivicLens Authentication Service
Handles password hashing with bcrypt, JWT token creation/verification, user registration, and authentication against PostgreSQL.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
import bcrypt
import jwt
from sqlalchemy import select, or_
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.config import settings
from app.models.user import User
from app.schemas.user import UserRegister


class AuthService:

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash plain text password securely using bcrypt with auto-generated salt."""
        pwd_bytes = password.encode('utf-8')
        salt = bcrypt.gensalt(rounds=12)
        return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify plain text password against stored bcrypt hash."""
        try:
            return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
        except Exception:
            return False

    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Generate JWT access token with user id and role claims."""
        to_encode = data.copy()
        if "sub" in to_encode:
            to_encode["sub"] = str(to_encode["sub"])
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
        return encoded_jwt

    @staticmethod
    def decode_access_token(token: str) -> Optional[dict]:
        """Decode and validate JWT access token."""
        try:
            payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
            return payload
        except jwt.PyJWTError:
            return None

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        return db.scalar(select(User).where(User.email == email.lower().strip()))

    @staticmethod
    def get_user_by_username(db: Session, username: str) -> Optional[User]:
        return db.scalar(select(User).where(User.username == username.lower().strip()))

    @staticmethod
    def register_user(db: Session, user_in: UserRegister) -> User:
        """Register new citizen account in PostgreSQL. ALWAYS sets role='user'."""
        clean_email = user_in.email.lower().strip()
        clean_username = user_in.username.lower().strip()
        clean_full_name = user_in.full_name.strip()

        if not clean_full_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Full name is required."
            )

        # Check duplicate email
        if AuthService.get_user_by_email(db, clean_email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists."
            )

        # Check duplicate username
        if AuthService.get_user_by_username(db, clean_username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This username is already taken. Please choose another."
            )

        hashed_pwd = AuthService.hash_password(user_in.password)

        # STRICT SPEC RULE: Normal user registration ALWAYS creates role="user"
        new_user = User(
            email=clean_email,
            username=clean_username,
            full_name=clean_full_name,
            hashed_password=hashed_pwd,
            role="user",
            is_active=True
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user

    @staticmethod
    def authenticate_user(db: Session, username_or_email: str, password: str) -> User:
        """Authenticate user against PostgreSQL database using username or email."""
        clean_id = username_or_email.lower().strip()
        user = db.scalar(
            select(User).where(
                or_(
                    User.email == clean_id,
                    User.username == clean_id
                )
            )
        )

        if not user or not AuthService.verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username/email or password."
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This account has been deactivated."
            )

        return user

    @staticmethod
    def bootstrap_admin_account(db: Session) -> Optional[User]:
        """Bootstrap default admin account from environment variables if not already present."""
        admin_email = getattr(settings, "ADMIN_BOOTSTRAP_EMAIL", "") or "admin@civiclens.gov.in"
        admin_password = getattr(settings, "ADMIN_BOOTSTRAP_PASSWORD", "") or "CivicLensAdmin2026!"
        
        clean_email = admin_email.lower().strip()
        existing = AuthService.get_user_by_email(db, clean_email)
        if existing:
            if existing.role != "admin":
                existing.role = "admin"
                db.commit()
            return existing

        hashed_pwd = AuthService.hash_password(admin_password)
        admin_user = User(
            email=clean_email,
            username="admin",
            full_name="CivicLens Platform Administrator",
            hashed_password=hashed_pwd,
            role="admin",
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        return admin_user
