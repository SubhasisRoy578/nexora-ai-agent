"""
Nexora AI — FastAPI entry point.
Optimized for Render free tier (512 MB RAM).
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from pathlib import Path
import os
import logging

load_dotenv()

# ── Structured Logging ─────────────────────────────────────────────────────────
log_level = os.environ.get("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, log_level, logging.INFO),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Nexora AI",
    version="11.0.0",
    description="Nexora AI — RAG-powered chat with persistent PostgreSQL storage",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Database Init ──────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    try:
        from app.database import init_db
        init_db()
    except Exception as e:
        logger.warning(f"DB init failed: {e}")

    logger.info(
        f"Nexora AI started — "
        f"default_provider={os.environ.get('DEFAULT_AI_PROVIDER', 'gemini')}, "
        f"fallback_order={os.environ.get('AI_FALLBACK_ORDER', 'gemini,groq,openrouter')}"
    )


# ── Routers ────────────────────────────────────────────────────────────────────
from app.routes.chat_routes import router as chat_router
from app.routes.upload_routes import router as upload_router
from app.routes.rag_routes import router as rag_router
from app.routes.vector_routes import router as vector_router
from app.routes.auth_routes import router as auth_router
from app.routes.analytics_routes import router as analytics_router
from app.routes.settings_routes import router as settings_router
from app.routes.learning_routes import router as learning_router
from app.routes.websocket_routes import router as websocket_router
from app.routes.browser_routes import router as browser_router

app.include_router(chat_router, prefix="/api/chat", tags=["Chat"])
app.include_router(upload_router, prefix="/api/upload", tags=["Upload"])
app.include_router(rag_router, prefix="/api/rag", tags=["RAG"])
app.include_router(vector_router, prefix="/api/vector", tags=["Vector"])
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(analytics_router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(settings_router, prefix="/api/settings", tags=["Settings"])
app.include_router(learning_router, prefix="/api/learning", tags=["Learning"])
app.include_router(websocket_router, prefix="/api/websocket", tags=["Websocket"])
app.include_router(browser_router, prefix="/api/browser", tags=["Browser"])

print("[OK] All 10 simplified routers registered successfully")


# ── Static / Frontend ──────────────────────────────────────────────────────────
try:
    static_dir = Path("static")
    if static_dir.exists():
        app.mount("/static", StaticFiles(directory="static"), name="static")
        FRONTEND_PATH = static_dir / "index.html"

        @app.get("/app")
        async def frontend():
            return FileResponse(FRONTEND_PATH)

        print("[OK] Static files mounted")
except Exception as e:
    print(f"[WARN] Static files skipped: {e}")


# ── Health & Info ──────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {"status": "ok", "project": "Nexora AI", "version": "11.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.get("/capabilities")
async def capabilities():
    return {
        "chat": True,
        "rag": True,
        "file_upload": True,
        "persistent_memory": True,
        "openai_embeddings": True,
        "postgresql_backend": True,
    }


# ── Internal Debug Endpoints (Development Only) ───────────────────────────────
# These are NOT public API. Gated behind DEBUG/development mode.

_is_debug = (
    os.environ.get("DEBUG", "").lower() in ("true", "1", "yes")
    or os.environ.get("APP_ENV", "").lower() == "development"
)

if _is_debug:
    @app.get("/_internal/ai/health", tags=["Internal"], include_in_schema=False)
    async def _internal_ai_health():
        """Internal: Provider health status (debug only, not publicly exposed)."""
        from app.ai.gateway import gateway
        health_status = await gateway.get_health_status()
        return {
            "status": "ok",
            "debug": True,
            "default_provider": os.environ.get("DEFAULT_AI_PROVIDER", "gemini"),
            "fallback_order": os.environ.get("AI_FALLBACK_ORDER", "gemini,groq,openrouter"),
            "providers": health_status,
        }

    @app.get("/_internal/ai/capabilities", tags=["Internal"], include_in_schema=False)
    async def _internal_ai_capabilities():
        """Internal: Provider capability declarations (debug only)."""
        from app.ai.gateway import gateway
        return {
            "status": "ok",
            "debug": True,
            "capabilities": gateway.get_capabilities(),
        }

    logger.info("[OK] Internal debug endpoints registered (/_internal/ai/*)")