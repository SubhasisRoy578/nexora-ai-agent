import os
import asyncio
import logging
from typing import List, Dict, AsyncIterator

from app.ai.providers.base import AIProvider
from app.ai.exceptions import (
    ProviderError,
    ProviderTimeoutError,
    AuthenticationError,
    classify_provider_error,
)

logger = logging.getLogger(__name__)


class GroqProvider(AIProvider):

    @property
    def provider_name(self) -> str:
        return "groq"

    def is_available(self) -> bool:
        return bool(os.environ.get("GROQ_API_KEY"))

    def _get_client(self):
        """Create and return an AsyncGroq client."""
        try:
            from groq import AsyncGroq
        except ImportError:
            raise ProviderError(
                "groq library not installed",
                provider_name="groq",
            )

        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            raise AuthenticationError(
                "GROQ_API_KEY not set in environment variables",
                provider_name="groq",
            )

        return AsyncGroq(api_key=api_key)

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> str:
        client = self._get_client()
        model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
        timeout = int(os.environ.get("REQUEST_TIMEOUT", "60"))

        try:
            completion = await asyncio.wait_for(
                client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                ),
                timeout=timeout,
            )
            return completion.choices[0].message.content

        except asyncio.TimeoutError:
            raise ProviderTimeoutError(
                message=f"Groq request timed out after {timeout}s",
                provider_name="groq",
                timeout=timeout,
            )
        except Exception as e:
            if isinstance(e, (ProviderError, ProviderTimeoutError)):
                raise
            raise classify_provider_error(e, "groq")

    async def generate_stream(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> AsyncIterator[str]:
        client = self._get_client()
        model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")

        try:
            response = await client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True,
            )

            async for chunk in response:
                token = chunk.choices[0].delta.content
                if token:
                    yield token

        except Exception as e:
            if isinstance(e, (ProviderError, ProviderTimeoutError)):
                raise
            raise classify_provider_error(e, "groq")


# ── Backward-compatible standalone function ────────────────────────────────────
# Used by app/ai/model_router.py

async def generate_groq_response(prompt: str) -> str:
    """Legacy function — delegates to GroqProvider."""
    provider = GroqProvider()
    messages = [{"role": "user", "content": prompt}]
    return await provider.generate_response(messages)
