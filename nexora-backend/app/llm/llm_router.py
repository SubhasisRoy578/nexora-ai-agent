# ==================================================
# NEXORA AI — LLM ROUTER
# Supports: Groq, Gemini, OpenRouter
# Features:
#   - ask_llm()    → standard full response
#   - stream_llm() → async generator, token by token
#   - Automatic fallback chain on failure (via AIGateway)
#   - User-selectable provider
#
# NOTE: This module now delegates to the unified AIGateway
# for all provider routing, fallback, retry, and health
# monitoring. All public function signatures are preserved
# for backward compatibility.
# ==================================================

import logging
from typing import Optional

logger = logging.getLogger(__name__)


# ── Lazy gateway import to avoid circular imports ──────────────────────────────

def _get_gateway():
    from app.ai.gateway import gateway
    return gateway


# ==================================================
# BACKWARD-COMPAT: Provider registry & fallback chain
# Kept so any code inspecting these constants still works.
# Actual routing goes through the AIGateway.
# ==================================================

# Legacy imports — kept so `from app.llm.llm_router import ...` doesn't break
# if any external code does deep inspection. The actual functions are unused.
try:
    from app.llm.providers.groq import generate as groq_generate
    from app.llm.providers.groq import stream as groq_stream
    from app.llm.providers.gemini import generate as gemini_generate
    from app.llm.providers.gemini import stream as gemini_stream
    from app.llm.providers.openai import generate as openai_generate
    from app.llm.providers.openai import stream as openai_stream

    PROVIDER_REGISTRY = {
        "groq": {
            "generate": groq_generate,
            "stream":   groq_stream,
        },
        "gemini": {
            "generate": gemini_generate,
            "stream":   gemini_stream,
        },
        "openai": {
            "generate": openai_generate,
            "stream":   openai_stream,
        },
    }
except ImportError:
    PROVIDER_REGISTRY = {}

DEFAULT_FALLBACK_CHAIN = ["groq", "gemini", "openai"]


def _build_chain(provider: str = None) -> list:
    if provider and provider in PROVIDER_REGISTRY:
        return [provider] + [
            p for p in DEFAULT_FALLBACK_CHAIN
            if p != provider
        ]
    return DEFAULT_FALLBACK_CHAIN


# ==================================================
# STANDARD (NON-STREAMING) RESPONSE
# Delegates to AIGateway.get_chat_response()
# ==================================================

async def ask_llm(
    prompt: str,
    provider: str = None
) -> str:
    """
    Get a full AI response. Delegates to the unified AIGateway
    with full fallback, retry, and health monitoring.

    Args:
        prompt: The user prompt string.
        provider: Optional provider override (e.g. "groq", "gemini").

    Returns:
        The AI-generated response string.
    """
    gw = _get_gateway()
    messages = [{"role": "user", "content": prompt}]

    try:
        response, provider_used = await gw.get_chat_response(
            messages=messages,
            requested_provider=provider,
        )
        logger.info(f"[LLMRouter] Success via gateway: {provider_used}")
        return response

    except Exception as e:
        logger.error(f"[LLMRouter] All providers failed: {e}")
        return (
            "I'm having trouble connecting to my AI providers. "
            "Please try again in a moment."
        )


# ==================================================
# STREAMING RESPONSE
# Yields tokens one by one as async generator.
# Delegates to AIGateway.stream_response()
# ==================================================

async def stream_llm(
    prompt: str,
    provider: str = None
):
    """
    Async generator — yields string tokens one by one.
    Delegates to the unified AIGateway with full fallback.

    Usage:
        async for token in stream_llm(prompt, provider="groq"):
            print(token, end="", flush=True)
    """
    gw = _get_gateway()
    messages = [{"role": "user", "content": prompt}]

    async for token in gw.stream_response(
        messages=messages,
        requested_provider=provider,
    ):
        yield token


# ==================================================
# CONVENIENCE HELPERS
# ==================================================

async def ask_groq(prompt: str) -> str:
    return await ask_llm(prompt, provider="groq")

async def ask_gemini(prompt: str) -> str:
    return await ask_llm(prompt, provider="gemini")

async def ask_openai(prompt: str) -> str:
    return await ask_llm(prompt, provider="openai")

def get_available_providers() -> list:
    gw = _get_gateway()
    return gw.get_available_providers()