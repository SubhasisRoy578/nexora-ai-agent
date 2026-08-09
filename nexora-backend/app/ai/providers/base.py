from abc import ABC, abstractmethod
from typing import List, Dict, AsyncIterator


class AIProvider(ABC):
    """Base interface for all AI providers in the Nexora AI Gateway."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Return the unique name of the provider."""
        pass

    @abstractmethod
    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> str:
        """
        Generate a complete response from the AI provider.

        Args:
            messages: List of message dicts with 'role' and 'content' keys.
            temperature: Sampling temperature.
            max_tokens: Maximum tokens to generate.

        Returns:
            The generated string response.

        Raises:
            ProviderError: On provider-specific failures.
            RateLimitError: On rate limit / quota exhaustion.
            ProviderTimeoutError: On request timeout.
            AuthenticationError: On invalid API key.
        """
        pass

    async def generate_stream(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> AsyncIterator[str]:
        """
        Stream tokens from the AI provider as an async iterator.

        Default implementation falls back to generate_response() and
        yields the entire response as a single chunk. Providers should
        override this for true token-by-token streaming.

        Args:
            messages: List of message dicts with 'role' and 'content' keys.
            temperature: Sampling temperature.
            max_tokens: Maximum tokens to generate.

        Yields:
            String tokens as they are generated.
        """
        # Default: non-streaming fallback
        response = await self.generate_response(
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        yield response

    def is_available(self) -> bool:
        """
        Check if this provider has the necessary configuration (API key, etc.)
        to accept requests. Returns False if the provider cannot possibly work.
        """
        return True

