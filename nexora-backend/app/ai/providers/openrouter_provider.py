import os
import json
import asyncio
import logging
from typing import List, Dict, AsyncIterator

import aiohttp

from app.ai.providers.base import AIProvider
from app.ai.exceptions import (
    ProviderError,
    ProviderTimeoutError,
    AuthenticationError,
    classify_provider_error,
)

logger = logging.getLogger(__name__)


class OpenRouterProvider(AIProvider):

    @property
    def provider_name(self) -> str:
        return "openrouter"

    def is_available(self) -> bool:
        return bool(os.environ.get("OPENROUTER_API_KEY"))

    def _get_config(self) -> dict:
        """Return validated request configuration."""
        api_key = os.environ.get("OPENROUTER_API_KEY")
        if not api_key:
            raise AuthenticationError(
                "OPENROUTER_API_KEY not set in environment variables",
                provider_name="openrouter",
            )

        return {
            "api_key": api_key,
            "base_url": os.environ.get(
                "OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"
            ),
            "model": os.environ.get(
                "OPENROUTER_MODEL", "deepseek/deepseek-chat-v3-0324:free"
            ),
            "timeout": int(os.environ.get("REQUEST_TIMEOUT", "60")),
        }

    def _build_headers(self, api_key: str) -> dict:
        return {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://nexora.ai",
            "X-Title": "Nexora AI",
        }

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> str:
        config = self._get_config()
        headers = self._build_headers(config["api_key"])

        payload = {
            "model": config["model"],
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        client_timeout = aiohttp.ClientTimeout(total=config["timeout"])

        try:
            async with aiohttp.ClientSession(timeout=client_timeout) as session:
                url = f"{config['base_url'].rstrip('/')}/chat/completions"
                async with session.post(
                    url, headers=headers, json=payload
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        raise ProviderError(
                            f"OpenRouter API returned status {response.status}: "
                            f"{error_text[:200]}",
                            provider_name="openrouter",
                            status_code=response.status,
                        )

                    data = await response.json()
                    return data["choices"][0]["message"]["content"]

        except asyncio.TimeoutError:
            raise ProviderTimeoutError(
                message=f"OpenRouter request timed out after {config['timeout']}s",
                provider_name="openrouter",
                timeout=config["timeout"],
            )
        except aiohttp.ClientError as e:
            raise classify_provider_error(e, "openrouter")
        except KeyError as e:
            raise ProviderError(
                f"Unexpected OpenRouter response format: missing {e}",
                provider_name="openrouter",
            )
        except Exception as e:
            if isinstance(e, (ProviderError, ProviderTimeoutError)):
                raise
            raise classify_provider_error(e, "openrouter")

    async def generate_stream(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> AsyncIterator[str]:
        config = self._get_config()
        headers = self._build_headers(config["api_key"])

        payload = {
            "model": config["model"],
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True,
        }

        client_timeout = aiohttp.ClientTimeout(total=config["timeout"])

        try:
            async with aiohttp.ClientSession(timeout=client_timeout) as session:
                url = f"{config['base_url'].rstrip('/')}/chat/completions"
                async with session.post(
                    url, headers=headers, json=payload
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        raise ProviderError(
                            f"OpenRouter streaming returned status "
                            f"{response.status}: {error_text[:200]}",
                            provider_name="openrouter",
                            status_code=response.status,
                        )

                    # Parse SSE stream
                    async for line in response.content:
                        decoded = line.decode("utf-8").strip()
                        if not decoded or not decoded.startswith("data: "):
                            continue
                        data_str = decoded[6:]  # Remove "data: " prefix
                        if data_str == "[DONE]":
                            break
                        try:
                            data = json.loads(data_str)
                            token = (
                                data.get("choices", [{}])[0]
                                .get("delta", {})
                                .get("content", "")
                            )
                            if token:
                                yield token
                        except json.JSONDecodeError:
                            continue

        except asyncio.TimeoutError:
            raise ProviderTimeoutError(
                message=f"OpenRouter stream timed out after {config['timeout']}s",
                provider_name="openrouter",
                timeout=config["timeout"],
            )
        except Exception as e:
            if isinstance(e, (ProviderError, ProviderTimeoutError)):
                raise
            raise classify_provider_error(e, "openrouter")


# ── Backward-compatible standalone function ────────────────────────────────────
# Used by app/ai/model_router.py

async def generate_openrouter_response(prompt: str) -> str:
    """Legacy function — delegates to OpenRouterProvider."""
    provider = OpenRouterProvider()
    messages = [{"role": "user", "content": prompt}]
    return await provider.generate_response(messages)
