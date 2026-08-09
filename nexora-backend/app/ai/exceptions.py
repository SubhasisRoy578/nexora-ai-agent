"""
Nexora AI — Structured Exception Hierarchy

Production-grade exceptions for AI provider operations.
Each exception carries metadata (provider, status_code, retry_after)
to enable intelligent retry and fallback decisions.
"""


class AIError(Exception):
    """Base exception for all AI-related errors."""

    def __init__(
        self,
        message: str,
        provider_name: str = "",
        status_code: int = 0,
        retry_after: float = 0.0,
        original_error: Exception = None,
    ):
        self.provider_name = provider_name
        self.status_code = status_code
        self.retry_after = retry_after
        self.original_error = original_error
        super().__init__(message)


class ProviderError(AIError):
    """A specific AI provider encountered an error."""
    pass


class RateLimitError(ProviderError):
    """Provider rate limit or quota exceeded."""

    def __init__(
        self,
        message: str = "Rate limit exceeded",
        provider_name: str = "",
        retry_after: float = 60.0,
        original_error: Exception = None,
    ):
        super().__init__(
            message=message,
            provider_name=provider_name,
            status_code=429,
            retry_after=retry_after,
            original_error=original_error,
        )


class ProviderTimeoutError(AIError):
    """Provider request timed out."""

    def __init__(
        self,
        message: str = "Request timed out",
        provider_name: str = "",
        timeout: float = 0.0,
        original_error: Exception = None,
    ):
        self.timeout = timeout
        super().__init__(
            message=message,
            provider_name=provider_name,
            status_code=408,
            retry_after=0.0,
            original_error=original_error,
        )


class AuthenticationError(ProviderError):
    """Provider API key is invalid or missing."""

    def __init__(
        self,
        message: str = "Authentication failed",
        provider_name: str = "",
        original_error: Exception = None,
    ):
        super().__init__(
            message=message,
            provider_name=provider_name,
            status_code=401,
            retry_after=0.0,
            original_error=original_error,
        )


class ModelNotFoundError(ProviderError):
    """Requested model is not available or has been decommissioned."""

    def __init__(
        self,
        message: str = "Model not found",
        provider_name: str = "",
        model_name: str = "",
        original_error: Exception = None,
    ):
        self.model_name = model_name
        super().__init__(
            message=message,
            provider_name=provider_name,
            status_code=404,
            retry_after=0.0,
            original_error=original_error,
        )


class AllProvidersFailedError(AIError):
    """All providers in the fallback chain have failed."""

    def __init__(
        self,
        message: str = "All AI providers failed",
        errors: list = None,
    ):
        self.errors = errors or []
        super().__init__(
            message=message,
            provider_name="all",
            status_code=503,
        )

    def __str__(self):
        base = super().__str__()
        if self.errors:
            details = "; ".join(str(e) for e in self.errors)
            return f"{base} — Details: {details}"
        return base


class ConfigurationError(AIError):
    """AI configuration is invalid or incomplete."""

    def __init__(
        self,
        message: str = "Configuration error",
        original_error: Exception = None,
    ):
        super().__init__(
            message=message,
            provider_name="config",
            status_code=500,
            original_error=original_error,
        )


# ── Helper: Classify raw exceptions into structured types ──────────────────

def classify_provider_error(
    error: Exception,
    provider_name: str,
) -> AIError:
    """
    Convert a raw provider exception into the appropriate structured type.
    This allows providers to raise generic exceptions and have them
    automatically classified for retry/fallback decisions.
    """
    error_str = str(error).lower()

    # Rate limit / quota
    rate_keywords = [
        "rate", "limit", "quota", "exceeded", "429", "too many",
        "resource_exhausted", "resourceexhausted",
    ]
    if any(kw in error_str for kw in rate_keywords):
        return RateLimitError(
            message=str(error),
            provider_name=provider_name,
            original_error=error,
        )

    # Timeout
    timeout_keywords = ["timeout", "timed out", "deadline", "408"]
    if any(kw in error_str for kw in timeout_keywords):
        return ProviderTimeoutError(
            message=str(error),
            provider_name=provider_name,
            original_error=error,
        )

    # Authentication
    auth_keywords = [
        "auth", "api_key", "api key", "invalid key", "unauthorized",
        "401", "permission", "forbidden", "403",
    ]
    if any(kw in error_str for kw in auth_keywords):
        return AuthenticationError(
            message=str(error),
            provider_name=provider_name,
            original_error=error,
        )

    # Model not found / decommissioned
    model_keywords = ["model", "not found", "decommissioned", "404", "deprecated"]
    if any(kw in error_str for kw in model_keywords):
        return ModelNotFoundError(
            message=str(error),
            provider_name=provider_name,
            original_error=error,
        )

    # Network / transient errors (should trigger fallback)
    network_keywords = [
        "network", "connection", "connect", "502", "503", "504",
        "unavailable", "refused", "reset", "broken pipe",
        "server error", "500", "internal",
    ]
    if any(kw in error_str for kw in network_keywords):
        return ProviderError(
            message=str(error),
            provider_name=provider_name,
            status_code=503,
            original_error=error,
        )

    # Default: generic provider error
    return ProviderError(
        message=str(error),
        provider_name=provider_name,
        original_error=error,
    )


def is_retryable(error: AIError) -> bool:
    """Determine if an error warrants a retry on the same provider."""
    if isinstance(error, RateLimitError):
        return True
    if isinstance(error, ProviderTimeoutError):
        return True
    if isinstance(error, ProviderError) and error.status_code in (500, 502, 503, 504):
        return True
    return False


def should_fallback(error: AIError) -> bool:
    """Determine if an error warrants fallback to the next provider."""
    # Auth and model errors won't be fixed by retrying the same provider
    # but a different provider might work
    if isinstance(error, AuthenticationError):
        return True
    if isinstance(error, ModelNotFoundError):
        return True
    # All retryable errors also trigger fallback after retries exhaust
    return is_retryable(error)
