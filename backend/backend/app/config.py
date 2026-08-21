import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    APP_TITLE: str = "CivicLens API"
    APP_VERSION: str = "1.0.0"
    ENV: str = "development"
    DATABASE_URL: str = ""
    POSTGRES_USER_DB_URL: str = "postgresql://postgres:postgres@localhost:5432/civiclens_db"
    JWT_SECRET_KEY: str = "civiclens_secret_key_2026_secure_auth_token_hash"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    FRONTEND_ORIGIN: str = "http://localhost:5173"
    LLM_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    ADMIN_BOOTSTRAP_EMAIL: str = "admin@civiclens.gov.in"
    ADMIN_BOOTSTRAP_PASSWORD: str = "CivicLensAdmin2026!"

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
