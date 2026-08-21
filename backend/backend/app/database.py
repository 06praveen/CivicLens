from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Session
from app.config import settings

class Base(DeclarativeBase):
    pass

engine = None
SessionLocal = None

auth_engine = None
AuthSessionLocal = None


def get_engine():
    global engine, SessionLocal
    if engine is None and settings.DATABASE_URL:
        db_url = settings.DATABASE_URL
        if db_url.startswith("postgresql://"):
            db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
            
        is_sqlite = db_url.startswith("sqlite")
        connect_args = {"check_same_thread": False} if is_sqlite else {}
        kwargs = {}
        if not is_sqlite:
            kwargs["pool_pre_ping"] = True
            kwargs["pool_size"] = 10
            kwargs["max_overflow"] = 20

        engine = create_engine(
            db_url,
            connect_args=connect_args,
            echo=False,
            **kwargs
        )
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return engine


def get_auth_engine():
    """Initializes PostgreSQL engine for User authentication storage."""
    global auth_engine, AuthSessionLocal
    if auth_engine is None:
        db_url = getattr(settings, "POSTGRES_USER_DB_URL", "") or settings.DATABASE_URL
        if not db_url:
            db_url = "sqlite:///civiclens.db"

        if db_url.startswith("postgresql://"):
            db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

        is_sqlite = db_url.startswith("sqlite")
        connect_args = {"check_same_thread": False} if is_sqlite else {}
        kwargs = {}
        if not is_sqlite:
            kwargs["pool_pre_ping"] = True
            kwargs["pool_size"] = 5
            kwargs["max_overflow"] = 10

        try:
            auth_engine = create_engine(db_url, connect_args=connect_args, echo=False, **kwargs)
            AuthSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=auth_engine)
            # Create user tables if not exist
            from app.models.user import User  # noqa
            from app.models.report import BudgetIssueReport  # noqa
            Base.metadata.create_all(bind=auth_engine)
            try:
                db_bootstrap = AuthSessionLocal()
                from app.services.auth_service import AuthService  # noqa
                AuthService.bootstrap_admin_account(db_bootstrap)
                db_bootstrap.close()
            except Exception:
                pass
        except Exception as e:
            # Fallback to main engine if PostgreSQL connection is not active locally
            auth_engine = get_engine()
            AuthSessionLocal = SessionLocal
            from app.models.user import User  # noqa
            if auth_engine:
                Base.metadata.create_all(bind=auth_engine)
                try:
                    db_bootstrap = AuthSessionLocal()
                    from app.services.auth_service import AuthService  # noqa
                    AuthService.bootstrap_admin_account(db_bootstrap)
                    db_bootstrap.close()
                except Exception:
                    pass

    return auth_engine


def get_db() -> Generator[Session, None, None]:
    get_engine()
    if SessionLocal is None:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection not configured. Please set DATABASE_URL in environment or backend/.env file."
        )
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_auth_db() -> Generator[Session, None, None]:
    """Dependency for User Authentication operations targeting PostgreSQL."""
    get_auth_engine()
    if AuthSessionLocal is None:
        yield from get_db()
        return
    db = AuthSessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> dict:
    if not settings.DATABASE_URL:
        return {
            "connected": False,
            "message": "DATABASE_URL environment variable is not configured."
        }
    try:
        eng = get_engine()
        if eng is None:
            return {"connected": False, "message": "Failed to initialize database engine."}
        with eng.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {
            "connected": True,
            "message": "Successfully connected to PostgreSQL database."
        }
    except Exception as e:
        return {
            "connected": False,
            "message": f"Database connection failed: {str(e)}"
        }
