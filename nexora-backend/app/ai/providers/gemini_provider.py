import os
import asyncio
import logging
from typing import List, Dict, AsyncIterator

from app.ai.providers.base import AIProvider
from app.ai.exceptions import (
    ProviderError,
    RateLimitError,
    ProviderTimeoutError,
    AuthenticationError,
    classify_provider_error,
)

logger = logging.getLogger(__name__)


class GeminiProvider(AIProvider):

    @property
    def provider_name(self) -> str:
        return "gemini"

    def is_available(self) -> bool:
        return bool(os.environ.get("GEMINI_API_KEY"))

    def _get_model(self):
        """Configure and return a Gemini GenerativeModel instance."""
        try:
            import google.generativeai as genai
        except ImportError:
            raise ProviderError(
                "google-generativeai library not installed",
                provider_name="gemini",
            )

        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise AuthenticationError(
                "GEMINI_API_KEY not set in environment variables",
                provider_name="gemini",
            )

        genai.configure(api_key=api_key)
        model_name = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
        return genai.GenerativeModel(model_name), genai

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> str:
        model, genai = self._get_model()
        timeout = int(os.environ.get("REQUEST_TIMEOUT", "60"))

        # Convert standardized messages to Gemini prompt format
        prompt_parts = []
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            prompt_parts.append(f"{role.upper()}: {content}")
        prompt = "\n\n".join(prompt_parts)

        try:
            if hasattr(model, "generate_content_async"):
                response = await asyncio.wait_for(
                    model.generate_content_async(
                        prompt,
                        generation_config=genai.types.GenerationConfig(
                            temperature=temperature,
                            max_output_tokens=max_tokens,
                        ),
                    ),
                    timeout=timeout,
                )
            else:
                # Fallback: run blocking call in executor with timeout
                loop = asyncio.get_event_loop()
                response = await asyncio.wait_for(
                    loop.run_in_executor(
                        None,
                        lambda: model.generate_content(
                            prompt,
                            generation_config=genai.types.GenerationConfig(
                                temperature=temperature,
                                max_output_tokens=max_tokens,
                            ),
                        ),
                    ),
                    timeout=timeout,
                )

            return response.text

        except asyncio.TimeoutError:
            raise ProviderTimeoutError(
                message=f"Gemini request timed out after {timeout}s",
                provider_name="gemini",
                timeout=timeout,
            )
        except Exception as e:
            if isinstance(e, (ProviderError, ProviderTimeoutError)):
                raise
            raise classify_provider_error(e, "gemini")

    async def generate_stream(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> AsyncIterator[str]:
        model, genai = self._get_model()

        # Convert messages to prompt
        prompt_parts = []
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            prompt_parts.append(f"{role.upper()}: {content}")
        prompt = "\n\n".join(prompt_parts)

        try:
            if hasattr(model, "generate_content_async"):
                response = await model.generate_content_async(
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=temperature,
                        max_output_tokens=max_tokens,
                    ),
                    stream=True,
                )
                async for chunk in response:
                    if chunk.text:
                        yield chunk.text
            else:
                # Fallback: blocking stream in executor, yield chunks
                loop = asyncio.get_event_loop()
                response = await loop.run_in_executor(
                    None,
                    lambda: model.generate_content(
                        prompt,
                        generation_config=genai.types.GenerationConfig(
                            temperature=temperature,
                            max_output_tokens=max_tokens,
                        ),
                        stream=True,
                    ),
                )
                for chunk in response:
                    if chunk.text:
                        yield chunk.text
                        await asyncio.sleep(0)

        except Exception as e:
            if isinstance(e, (ProviderError, ProviderTimeoutError)):
                raise
            raise classify_provider_error(e, "gemini")


# ── Backward-compatible standalone function ────────────────────────────────────
# Used by app/ai/model_router.py

async def generate_gemini_response(prompt: str) -> str:
    """Legacy function — delegates to GeminiProvider."""
    provider = GeminiProvider()
    messages = [{"role": "user", "content": prompt}]
    return await provider.generate_response(messages)
