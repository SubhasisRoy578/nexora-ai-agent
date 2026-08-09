# app/database/database.py
from sqlalchemy import create_engine
import logging
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

logger = logging.getLogger(__name__)

# ============================================
# SYNC DATABASE (For chat_routes.py)
# ============================================

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./nexora.db")

# Sync engine for traditional (non-async) routes
sync_engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {})
SyncSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)

Base = declarative_base()

def get_sync_db():
    """Dependency for sync routes (like chat)."""
    db = SyncSessionLocal()
    try:
        yield db
    finally:
        db.close()


# ============================================
# ASYNC DATABASE (For other parts)
# ============================================

# Try to import async dependencies, but fallback gracefully
try:
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy.orm import sessionmaker as async_sessionmaker

    async_db_url = DATABASE_URL
    if async_db_url.startswith("postgresql://"):
        async_db_url = async_db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif async_db_url.startswith("sqlite"):
        async_db_url = async_db_url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)

    async_engine = create_async_engine(async_db_url, echo=False, future=True)
    AsyncSessionLocal = async_sessionmaker(bind=async_engine, class_=AsyncSession, expire_on_commit=False)

    async def get_async_db():
        async with AsyncSessionLocal() as session:
            yield session

    ASYNC_AVAILABLE = True
    logger.info("async_database_available")

except Exception as exc:
    ASYNC_AVAILABLE = False
    logger.warning("async_database_unavailable_using_sync_adapter", extra={"error_type": type(exc).__name__})

    class _AsyncResult:
        def __init__(self, result):
            self._result = result

        def scalars(self):
            return self._result.scalars()

        def scalar_one_or_none(self):
            return self._result.scalar_one_or_none()

    class _AsyncSessionAdapter:
        def __init__(self):
            self._session = SyncSessionLocal()

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            self._session.close()

        async def execute(self, *args, **kwargs):
            return _AsyncResult(self._session.execute(*args, **kwargs))

        def add(self, *args, **kwargs):
            return self._session.add(*args, **kwargs)

        async def commit(self):
            self._session.commit()

        async def rollback(self):
            self._session.rollback()

        async def refresh(self, obj):
            self._session.refresh(obj)

        async def flush(self):
            self._session.flush()

    class AsyncSessionLocal:
        def __call__(self):
            return _AsyncSessionAdapter()

    AsyncSessionLocal = AsyncSessionLocal()

    async def get_async_db():
        async with AsyncSessionLocal() as session:
            yield session


# ============================================
# PGVECTOR DETECTION
# ============================================

HAS_PGVECTOR = False
try:
    from pgvector.sqlalchemy import Vector
    HAS_PGVECTOR = True
    logger.info("pgvector_detected")
except ImportError:
    logger.info("pgvector_not_installed")


# ============================================
# INIT DATABASE
# ============================================

def init_db():
    """Create all tables."""
    import app.database.models  # noqa: F401 - registers ORM models on Base metadata

    Base.metadata.create_all(bind=sync_engine)
    logger.info("database_tables_created_or_verified")


# For backward compatibility
get_db = get_sync_db
