"""
Nexora AI — Enhanced AI Gateway

The single authoritative entry point for every AI request in the system.

Features:
  - Config-driven provider selection (DEFAULT_AI_PROVIDER)
  - Config-driven fallback order (AI_FALLBACK_ORDER)
  - Provider health monitoring — skips unhealthy providers
  - Retry logic with exponential backoff per provider
  - Timeout enforcement on every request
  - Structured exception handling and logging
  - Streaming support with automatic fallback
  - Provider capability registry for future scalability
"""

import os
import asyncio
import logging
from typing import List, Dict, Tuple, Optional, AsyncIterator

from app.ai.providers.gemini_provider import GeminiProvider
from app.ai.providers.groq_provider import GroqProvider
from app.ai.providers.openrouter_provider import OpenRouterProvider
from app.ai.providers.base import AIProvider

from app.ai.health import get_health_monitor, ProviderHealthMonitor
from app.ai.capabilities import capability_registry, CapabilityRegistry
from app.ai.exceptions import (
    AIError,
    ProviderError,
    RateLimitError,
    ProviderTimeoutError,
    AuthenticationError,
    AllProvidersFailedError,
    ConfigurationError,
    classify_provider_error,
    is_retryable,
)

logger = logging.getLogger(__name__)


class AIGateway:
    """
    Unified AI Gateway — the single entry point for all AI operations.

    Provider selection and fallback order are fully driven by
    environment variables:
      - DEFAULT_AI_PROVIDER  (e.g. "gemini")
      - AI_FALLBACK_ORDER    (e.g. "gemini,groq,openrouter")

    No provider is hardcoded.
    """

    def __init__(self):
        # ── Provider instances ─────────────────────────────────────────────
        self._provider_instances: Dict[str, AIProvider] = {
            "gemini": GeminiProvider(),
            "groq": GroqProvider(),
            "openrouter": OpenRouterProvider(),
        }

        # Expose as public attribute for backward compatibility
        # (chat_routes.py test endpoint iterates over gateway.providers)
        self.providers = self._provider_instances

        # ── Config-driven settings ─────────────────────────────────────────
        self._default_provider = os.environ.get(
            "DEFAULT_AI_PROVIDER", "gemini"
        ).strip().lower()

        fallback_raw = os.environ.get(
            "AI_FALLBACK_ORDER", "gemini,groq,openrouter"
        )
        self._fallback_order = [
            p.strip().lower()
            for p in fallback_raw.split(",")
            if p.strip()
        ]

        self._default_temperature = float(
            os.environ.get("DEFAULT_TEMPERATURE", "0.7")
        )
        self._default_max_tokens = int(
            os.environ.get("DEFAULT_MAX_TOKENS", "4096")
        )
        self._max_retries = int(
            os.environ.get("MAX_RETRIES_PER_PROVIDER", "2")
        )

        # ── Health monitor ─────────────────────────────────────────────────
        cooldown = int(os.environ.get("PROVIDER_COOLDOWN_SECONDS", "60"))
        threshold = int(os.environ.get("PROVIDER_FAILURE_THRESHOLD", "3"))
        self._health: ProviderHealthMonitor = get_health_monitor(
            failure_threshold=threshold,
            cooldown_seconds=cooldown,
        )

        # ── Capability registry ────────────────────────────────────────────
        self._capabilities: CapabilityRegistry = capability_registry

        logger.info(
            f"[AIGateway] Initialized — "
            f"default_provider={self._default_provider}, "
            f"fallback_order={self._fallback_order}, "
            f"max_retries={self._max_retries}"
        )

    # ── Fallback chain builder ─────────────────────────────────────────────

    def _build_chain(
        self, requested_provider: Optional[str] = None
    ) -> list:
        """
        Build the ordered fallback chain. Fully config-driven.

        Priority:
          1. Explicitly requested provider (if any)
          2. DEFAULT_AI_PROVIDER from env
          3. AI_FALLBACK_ORDER from env (remaining providers)
        """
        chain = list(self._fallback_order)

        # Determine primary provider
        primary = (
            requested_provider.strip().lower()
            if requested_provider
            else self._default_provider
        )

        # Move primary to front
        if primary and primary in self._provider_instances:
            if primary in chain:
                chain.remove(primary)
            chain.insert(0, primary)

        return chain

    # ── Retry helper ───────────────────────────────────────────────────────

    async def _attempt_with_retries(
        self,
        provider: AIProvider,
        messages: List[Dict[str, str]],
        temperature: float,
        max_tokens: int,
    ) -> str:
        """
        Attempt a request with retries and exponential backoff.
        Only retries on transient/retryable errors.
        """
        last_error = None

        for attempt in range(1, self._max_retries + 1):
            try:
                response = await provider.generate_response(
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
                return response

            except AIError as e:
                last_error = e
                if is_retryable(e) and attempt < self._max_retries:
                    backoff = min(2 ** attempt, 8)
                    logger.warning(
                        f"[AIGateway] {provider.provider_name} attempt "
                        f"{attempt}/{self._max_retries} failed "
                        f"(retryable: {type(e).__name__}). "
                        f"Retrying in {backoff}s..."
                    )
                    await asyncio.sleep(backoff)
                    continue
                else:
                    raise

            except Exception as e:
                last_error = classify_provider_error(e, provider.provider_name)
                if is_retryable(last_error) and attempt < self._max_retries:
                    backoff = min(2 ** attempt, 8)
                    logger.warning(
                        f"[AIGateway] {provider.provider_name} attempt "
                        f"{attempt}/{self._max_retries} failed "
                        f"(retryable). Retrying in {backoff}s..."
                    )
                    await asyncio.sleep(backoff)
                    continue
                else:
                    raise last_error

        # Should not reach here, but just in case
        raise last_error

    # ══════════════════════════════════════════════════════════════════════
    # PUBLIC API: get_chat_response
    # Exact same signature as before — fully backward compatible
    # ══════════════════════════════════════════════════════════════════════

    async def get_chat_response(
        self,
        messages: List[Dict[str, str]],
        requested_provider: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> Tuple[str, str]:
        """
        Get a chat response with automatic fallback.

        Args:
            messages: List of message dicts with 'role' and 'content'.
            requested_provider: Optional provider override.
            temperature: Optional temperature override (defaults to env).
            max_tokens: Optional max_tokens override (defaults to env).

        Returns:
            Tuple of (response_text, provider_used).

        Raises:
            AllProvidersFailedError: If every provider in the chain fails.
        """
        temp = temperature if temperature is not None else self._default_temperature
        tokens = max_tokens if max_tokens is not None else self._default_max_tokens
        chain = self._build_chain(requested_provider)
        errors: list = []

        for provider_name in chain:
            provider = self._provider_instances.get(provider_name)
            if not provider:
                logger.debug(
                    f"[AIGateway] Provider '{provider_name}' not registered, skipping"
                )
                continue

            # Skip providers that aren't configured
            if not provider.is_available():
                logger.debug(
                    f"[AIGateway] Provider '{provider_name}' not available "
                    f"(missing API key), skipping"
                )
                continue

            # Skip unhealthy providers (in cooldown)
            if not await self._health.is_available(provider_name):
                logger.info(
                    f"[AIGateway] Provider '{provider_name}' in cooldown, skipping"
                )
                continue

            try:
                logger.info(
                    f"[AIGateway] Attempting provider: {provider_name}"
                )
                response = await self._attempt_with_retries(
                    provider=provider,
                    messages=messages,
                    temperature=temp,
                    max_tokens=tokens,
                )

                # Success — record health and return
                await self._health.record_success(provider_name)
                logger.info(
                    f"[AIGateway] Success with {provider_name}"
                )
                return response, provider_name

            except AIError as e:
                error_msg = str(e)
                logger.warning(
                    f"[AIGateway] Provider {provider_name} failed: "
                    f"{type(e).__name__}: {error_msg[:150]}"
                )
                await self._health.record_failure(provider_name, error_msg)
                errors.append(e)
                continue

            except Exception as e:
                error_msg = str(e)
                logger.error(
                    f"[AIGateway] Unexpected error with {provider_name}: "
                    f"{error_msg[:150]}"
                )
                classified = classify_provider_error(e, provider_name)
                await self._health.record_failure(provider_name, error_msg)
                errors.append(classified)
                continue

        # All providers failed
        raise AllProvidersFailedError(
            message="All AI providers in the fallback chain failed",
            errors=errors,
        )

    # ══════════════════════════════════════════════════════════════════════
    # PUBLIC API: stream_response
    # New method — async generator for streaming with fallback
    # ══════════════════════════════════════════════════════════════════════

    async def stream_response(
        self,
        messages: List[Dict[str, str]],
        requested_provider: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> AsyncIterator[str]:
        """
        Stream tokens with automatic provider fallback.

        Yields:
            String tokens as they arrive.

        On failure, falls back to the next provider in the chain.
        If all providers fail, yields an error message.
        """
        temp = temperature if temperature is not None else self._default_temperature
        tokens = max_tokens if max_tokens is not None else self._default_max_tokens
        chain = self._build_chain(requested_provider)
        errors: list = []

        for provider_name in chain:
            provider = self._provider_instances.get(provider_name)
            if not provider:
                continue
            if not provider.is_available():
                continue
            if not await self._health.is_available(provider_name):
                logger.info(
                    f"[AIGateway] Stream: provider '{provider_name}' in cooldown, skipping"
                )
                continue

            try:
                logger.info(
                    f"[AIGateway] Streaming via: {provider_name}"
                )

                # Check capability for true streaming
                if self._capabilities.supports(provider_name, "supports_streaming"):
                    async for token in provider.generate_stream(
                        messages=messages,
                        temperature=temp,
                        max_tokens=tokens,
                    ):
                        yield token
                else:
                    # Fallback: get full response and yield at once
                    response = await provider.generate_response(
                        messages=messages,
                        temperature=temp,
                        max_tokens=tokens,
                    )
                    yield response

                # If we got here without exception, streaming succeeded
                await self._health.record_success(provider_name)
                logger.info(
                    f"[AIGateway] Stream completed successfully with {provider_name}"
                )
                return

            except Exception as e:
                error_msg = str(e)
                logger.warning(
                    f"[AIGateway] Stream with {provider_name} failed: "
                    f"{error_msg[:150]}. Trying next provider..."
                )
                await self._health.record_failure(provider_name, error_msg)
                errors.append(str(e))
                continue

        # All providers failed
        yield (
            "I'm having trouble connecting to my AI providers. "
            "Please try again in a moment."
        )

    # ══════════════════════════════════════════════════════════════════════
    # INTERNAL API: Health & Capabilities (not exposed publicly)
    # ══════════════════════════════════════════════════════════════════════

    async def get_health_status(self) -> dict:
        """Get internal provider health status (admin/debug use only)."""
        return await self._health.get_status()

    def get_capabilities(self) -> dict:
        """Get provider capability declarations."""
        return self._capabilities.list_all()

    def get_available_providers(self) -> list:
        """Return names of all registered providers."""
        return list(self._provider_instances.keys())

    def get_fallback_order(self) -> list:
        """Return the current config-driven fallback order."""
        return list(self._fallback_order)


# ── Module-level singleton ─────────────────────────────────────────────────────
# Preserves: `from app.ai.gateway import gateway`

gateway = AIGateway()

