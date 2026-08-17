# app/routes/chat_routes.py
import os
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from app.database import get_db
from app.simplified_rag import search_rag, store_message, get_recent_messages

router = APIRouter()

from app.ai.gateway import gateway

# ============================================
# REQUEST MODEL
# ============================================

class ChatRequest(BaseModel):
    user_id: str
    message: str
    provider: Optional[str] = None  # Allows forcing a specific provider
    tools: Optional[list[str]] = None

# ============================================
# CHAT ENDPOINT
# ============================================

from fastapi.responses import StreamingResponse

@router.post("/chat")
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    from app.agents.orchestrator import AgentOrchestrator
    
    orchestrator = AgentOrchestrator()
    
    return StreamingResponse(
        orchestrator.stream_run(
            goal=request.message,
            user_id=request.user_id,
            provider=request.provider
        ),
        media_type="text/plain"
    )

# ============================================
# HISTORY ENDPOINTS
# ============================================

@router.get("/history/{user_id}")
async def get_history(user_id: str, db: Session = Depends(get_db)):
    try:
        history = get_recent_messages(db, user_id=user_id, limit=50)
        return {"success": True, "history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

@router.delete("/history/{user_id}")
async def clear_history(user_id: str, db: Session = Depends(get_db)):
    from app.models.chat import ChatMessage
    try:
        deleted = db.query(ChatMessage).filter(ChatMessage.user_id == user_id).delete()
        db.commit()
        return {"success": True, "deleted_count": deleted}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

# ============================================
# TEST ENDPOINTS
# ============================================

@router.get("/test")
async def test_chat():
    """Test if the chat router is working."""
    return {
        "status": "ok",
        "message": "Chat router is working with fallback architecture!",
        "providers_configured": {
            "groq": bool(os.environ.get("GROQ_API_KEY")),
            "gemini": bool(os.environ.get("GEMINI_API_KEY")),
            "openrouter": bool(os.environ.get("OPENROUTER_API_KEY")),
        },
        "active_provider": os.environ.get("LLM_PROVIDER", "gemini")
    }

@router.get("/test/providers")
async def test_all_providers():
    """Test all LLM providers and report status."""
    test_messages = [{"role": "user", "content": "Say 'hello' in one word."}]
    
    results = {}
    
    for name, provider in gateway.providers.items():
        try:
            response = await provider.generate_response(test_messages)
            results[name] = {"status": "working", "response": response[:50]}
        except Exception as e:
            results[name] = {"status": "failed", "error": str(e)[:100]}
    
    return {"success": True, "results": results}
