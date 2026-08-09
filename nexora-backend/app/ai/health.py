"""
Nexora AI — Provider Health Monitor

Tracks provider availability, recent failures, cooldown periods, and recovery.
Temporarily avoids unhealthy providers until they recover.
Thread-safe via asyncio.Lock.
"""

import time
import asyncio
import logging
from typing import Dict, Optional
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass
class ProviderHealthState:
    """Health state for a single provider."""
    name: str
    is_healthy: bool = True
    consecutive_failures: int = 0
    total_failures: int = 0
    total_successes: int = 0
    last_failure_time: float = 0.0
    last_success_time: float = 0.0
    last_error_message: str = ""
    cooldown_until: float = 0.0

    @property
    def total_requests(self) -> int:
        return self.total_successes + self.total_failures

    @property
    def success_rate(self) -> float:
        if self.total_requests == 0:
            return 1.0
        return self.total_successes / self.total_requests

    def to_dict(self) -> dict:
        """Serialize state for API responses."""
        now = time.time()
        cooldown_remaining = max(0.0, self.cooldown_until - now)
        return {
            "name": self.name,
            "is_healthy": self.is_healthy,
            "consecutive_failures": self.consecutive_failures,
            "total_failures": self.total_failures,
            "total_successes": self.total_successes,
            "total_requests": self.total_requests,
            "success_rate": round(self.success_rate, 3),
            "last_error": self.last_error_message or None,
            "cooldown_remaining_seconds": round(cooldown_remaining, 1),
            "in_cooldown": cooldown_remaining > 0,
        }


class ProviderHealthMonitor:
    """
    Monitors the health of AI providers.

    - Tracks consecutive failures per provider.
    - Puts providers in cooldown after exceeding the failure threshold.
    - Automatically recovers providers after the cooldown period.
    - Thread-safe for async usage.
    """

    def __init__(
        self,
        failure_threshold: int = 3,
        cooldown_seconds: int = 60,
    ):
        self._failure_threshold = failure_threshold
        self._cooldown_seconds = cooldown_seconds
        self._states: Dict[str, ProviderHealthState] = {}
        self._lock = asyncio.Lock()

    def _get_state(self, provider_name: str) -> ProviderHealthState:
        """Get or create health state for a provider."""
        if provider_name not in self._states:
            self._states[provider_name] = ProviderHealthState(name=provider_name)
        return self._states[provider_name]

    async def is_available(self, provider_name: str) -> bool:
        """Check if a provider is available (not in cooldown)."""
        async with self._lock:
            state = self._get_state(provider_name)
            now = time.time()

            # If cooldown has expired, mark as recovered
            if not state.is_healthy and now >= state.cooldown_until:
                state.is_healthy = True
                state.consecutive_failures = 0
                logger.info(
                    f"[HealthMonitor] Provider '{provider_name}' recovered "
                    f"after cooldown period"
                )

            return state.is_healthy

    async def record_success(self, provider_name: str) -> None:
        """Record a successful request to a provider."""
        async with self._lock:
            state = self._get_state(provider_name)
            state.is_healthy = True
            state.consecutive_failures = 0
            state.total_successes += 1
            state.last_success_time = time.time()
            logger.debug(
                f"[HealthMonitor] Provider '{provider_name}' success "
                f"(total: {state.total_successes})"
            )

    async def record_failure(
        self,
        provider_name: str,
        error_message: str = "",
    ) -> None:
        """
        Record a failed request. If consecutive failures exceed the threshold,
        put the provider in cooldown.
        """
        async with self._lock:
            state = self._get_state(provider_name)
            state.consecutive_failures += 1
            state.total_failures += 1
            state.last_failure_time = time.time()
            state.last_error_message = error_message[:200]  # Truncate

            if state.consecutive_failures >= self._failure_threshold:
                state.is_healthy = False
                state.cooldown_until = time.time() + self._cooldown_seconds
                logger.warning(
                    f"[HealthMonitor] Provider '{provider_name}' marked UNHEALTHY "
                    f"after {state.consecutive_failures} consecutive failures. "
                    f"Cooldown: {self._cooldown_seconds}s. "
                    f"Last error: {error_message[:100]}"
                )
            else:
                logger.info(
                    f"[HealthMonitor] Provider '{provider_name}' failure "
                    f"({state.consecutive_failures}/{self._failure_threshold}). "
                    f"Error: {error_message[:100]}"
                )

    async def get_available_providers(self, ordered_names: list) -> list:
        """
        Filter a list of provider names, returning only those currently available.
        Preserves the input order.
        """
        available = []
        for name in ordered_names:
            if await self.is_available(name):
                available.append(name)
        return available

    async def get_status(self) -> Dict[str, dict]:
        """Get health status of all tracked providers."""
        async with self._lock:
            # Refresh cooldown status
            now = time.time()
            for state in self._states.values():
                if not state.is_healthy and now >= state.cooldown_until:
                    state.is_healthy = True
                    state.consecutive_failures = 0

            return {
                name: state.to_dict()
                for name, state in self._states.items()
            }

    async def reset(self, provider_name: Optional[str] = None) -> None:
        """Reset health state for a provider (or all providers)."""
        async with self._lock:
            if provider_name:
                if provider_name in self._states:
                    self._states[provider_name] = ProviderHealthState(
                        name=provider_name
                    )
                    logger.info(
                        f"[HealthMonitor] Reset health state for '{provider_name}'"
                    )
            else:
                self._states.clear()
                logger.info("[HealthMonitor] Reset all provider health states")


# ── Module-level singleton ─────────────────────────────────────────────────────
# Initialized lazily by the gateway to use config values.
# Direct import is also possible for testing.

_monitor: Optional[ProviderHealthMonitor] = None


def get_health_monitor(
    failure_threshold: int = 3,
    cooldown_seconds: int = 60,
) -> ProviderHealthMonitor:
    """Get or create the global ProviderHealthMonitor singleton."""
    global _monitor
    if _monitor is None:
        _monitor = ProviderHealthMonitor(
            failure_threshold=failure_threshold,
            cooldown_seconds=cooldown_seconds,
        )
    return _monitor
