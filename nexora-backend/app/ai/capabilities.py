"""
Nexora AI — Provider Capability Registry

Each provider declares its capabilities so the AI Gateway (and future
subsystems) can make intelligent routing decisions without hardcoding
provider-specific knowledge.

This is intentionally lightweight and extensible — new capabilities
can be added as simple keys without changing existing providers.
"""

from dataclasses import dataclass, field
from typing import Dict, Optional


@dataclass(frozen=True)
class ProviderCapabilities:
    """
    Declares what a specific AI provider supports.

    All fields default to conservative values so that a provider
    only needs to override what it actually supports.
    """

    # ── Identity ───────────────────────────────────────────────────────────
    provider_name: str

    # ── Core capabilities ──────────────────────────────────────────────────
    supports_streaming: bool = False
    supports_chat_completions: bool = True
    supports_system_messages: bool = True
    supports_structured_output: bool = False
    supports_function_calling: bool = False
    supports_vision: bool = False

    # ── Context limits ─────────────────────────────────────────────────────
    max_context_tokens: int = 8_192
    max_output_tokens: int = 4_096

    # ── Metadata ───────────────────────────────────────────────────────────
    default_model: str = ""
    api_style: str = "openai"  # "openai" | "google" | "custom"


# ── Default capability declarations per provider ───────────────────────────

PROVIDER_CAPABILITIES: Dict[str, ProviderCapabilities] = {
    "gemini": ProviderCapabilities(
        provider_name="gemini",
        supports_streaming=True,
        supports_chat_completions=True,
        supports_system_messages=True,
        supports_structured_output=True,
        supports_function_calling=True,
        supports_vision=True,
        max_context_tokens=1_048_576,  # Gemini 2.5 Flash
        max_output_tokens=65_536,
        default_model="gemini-2.5-flash",
        api_style="google",
    ),
    "groq": ProviderCapabilities(
        provider_name="groq",
        supports_streaming=True,
        supports_chat_completions=True,
        supports_system_messages=True,
        supports_structured_output=False,
        supports_function_calling=True,
        supports_vision=False,
        max_context_tokens=131_072,  # Llama 3.3 70B
        max_output_tokens=32_768,
        default_model="llama-3.3-70b-versatile",
        api_style="openai",
    ),
    "openrouter": ProviderCapabilities(
        provider_name="openrouter",
        supports_streaming=True,
        supports_chat_completions=True,
        supports_system_messages=True,
        supports_structured_output=False,
        supports_function_calling=False,
        supports_vision=False,
        max_context_tokens=65_536,  # Varies per model
        max_output_tokens=8_192,
        default_model="deepseek/deepseek-chat-v3-0324:free",
        api_style="openai",
    ),
}


class CapabilityRegistry:
    """
    Central registry that maps provider names to their declared capabilities.

    Usage:
        registry = CapabilityRegistry()
        caps = registry.get("gemini")
        if caps and caps.supports_streaming:
            ...
    """

    def __init__(self):
        self._registry: Dict[str, ProviderCapabilities] = dict(
            PROVIDER_CAPABILITIES
        )

    def register(self, capabilities: ProviderCapabilities) -> None:
        """Register or update capabilities for a provider."""
        self._registry[capabilities.provider_name] = capabilities

    def get(self, provider_name: str) -> Optional[ProviderCapabilities]:
        """Get capabilities for a provider. Returns None if unknown."""
        return self._registry.get(provider_name)

    def supports(self, provider_name: str, capability: str) -> bool:
        """
        Check if a provider supports a specific capability.

        Args:
            provider_name: The provider to query.
            capability: Attribute name on ProviderCapabilities (e.g. 'supports_streaming').

        Returns:
            True if the capability is supported, False otherwise.
        """
        caps = self.get(provider_name)
        if caps is None:
            return False
        return getattr(caps, capability, False)

    def get_providers_with(self, capability: str) -> list:
        """Return all provider names that support a given capability."""
        return [
            name
            for name, caps in self._registry.items()
            if getattr(caps, capability, False)
        ]

    def list_all(self) -> Dict[str, dict]:
        """Return all registered capabilities as serializable dicts."""
        result = {}
        for name, caps in self._registry.items():
            result[name] = {
                "provider_name": caps.provider_name,
                "supports_streaming": caps.supports_streaming,
                "supports_chat_completions": caps.supports_chat_completions,
                "supports_system_messages": caps.supports_system_messages,
                "supports_structured_output": caps.supports_structured_output,
                "supports_function_calling": caps.supports_function_calling,
                "supports_vision": caps.supports_vision,
                "max_context_tokens": caps.max_context_tokens,
                "max_output_tokens": caps.max_output_tokens,
                "default_model": caps.default_model,
                "api_style": caps.api_style,
            }
        return result


# ── Module-level singleton ─────────────────────────────────────────────────────

capability_registry = CapabilityRegistry()
