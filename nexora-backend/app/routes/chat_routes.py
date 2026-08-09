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

# ============================================
# CHAT ENDPOINT
# ============================================

@router.post("/chat")
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    user_id = request.user_id
    message = request.message

    # 1. Retrieve recent messages from DB for conversation history
    history = []
    try:
        history = get_recent_messages(db, user_id=user_id, limit=10)
    except Exception as e:
        print(f"[DB history error]: {e}")

    # 2. Search for relevant context using RAG
    rag_context = ""
    sources = []
    try:
        rag_results = search_rag(db, message, top_k=3)
        if rag_results:
            filtered_results = [r for r in rag_results if r.get("similarity", 0) > 0.15]
            if filtered_results:
                rag_context = "\n---\n".join([r["text"] for r in filtered_results])
                sources = list({r["filename"] for r in filtered_results})
    except Exception as e:
        print(f"[RAG Retrieval Error]: {e}")

    # 3. Construct prompts
    system_prompt = "You are Nexora AI, a helpful, intelligent AI assistant."
    if rag_context:
        system_prompt += (
            f"\n\nContext from user's uploaded documents:\n{rag_context}\n\n"
            f"Instructions: Answer the question using the context above when relevant. "
            f"If the context doesn't contain the answer, use your general knowledge to answer, "
            f"but clearly state that the answer was not found in the uploaded documents."
        )

    messages = [{"role": "system", "content": system_prompt}]
    for msg in history:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": message})

    # 4. Call the selected LLM provider via AI Gateway with fallback
    try:
        ai_response, provider_used = await gateway.get_chat_response(messages, request.provider)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM API error: {str(e)}")

    # 5. Persist messages to database
    try:
        store_message(db, user_id, "user", message)
        store_message(db, user_id, "assistant", ai_response)
    except Exception as e:
        print(f"[DB memory write error]: {e}")

    return {
        "success": True,
        "response": ai_response,
        "provider_used": provider_used,
        "sources": sources,
        "history_count": len(history)
    }

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
