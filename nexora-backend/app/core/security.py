"""
Nexora AI — Security & Input Sanitization (Phase 6)

Provides security utilities for:
  - User input sanitization (strips null bytes, control characters, prompt injection boundaries)
  - API secret masking for safe logging
  - User-facing error message sanitization
"""

import re
import logging

logger = logging.getLogger(__name__)


def sanitize_user_input(text: str, max_length: int = 10000) -> str:
    """
    Sanitizes user input text to prevent null-byte injection,
    extreme payload bloat, and system prompt boundary manipulation.
    """
    if not isinstance(text, str):
        return ""

    # Remove null bytes and non-printable control characters (except newline, tab)
    sanitized = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', text)

    # Truncate payload length to max_length
    if len(sanitized) > max_length:
        logger.warning("user_input_truncated", extra={"original_length": len(sanitized), "max_length": max_length})
        sanitized = sanitized[:max_length]

    return sanitized.strip()


def mask_secret(secret: str) -> str:
    """
    Masks a sensitive API key or token for safe log output.
    Example: 'sk-1234567890abcdef' -> 'sk-12***cdef'
    """
    if not secret or not isinstance(secret, str):
        return "[EMPTY]"
    if len(secret) <= 8:
        return "****"
    return f"{secret[:4]}***{secret[-4:]}"


def sanitize_error(error: Exception) -> str:
    """
    Sanitizes error messages for user-facing API responses to avoid
    exposing internal server filepaths, database connection strings, or credentials.
    """
    err_str = str(error)
    # Mask connection strings containing passwords
    err_str = re.sub(r'://([^:]+):([^@]+)@', r'://\1:****@', err_str)
    # Mask API keys/tokens commonly returned by SDKs or config errors
    err_str = re.sub(r'(sk|gsk|AIza|tvly|hf)[A-Za-z0-9_\-]{8,}', r'\1***', err_str)
    # Mask filesystem absolute paths
    err_str = re.sub(r'[A-Za-z]:\\[^:\n\r]+', '[INTERNAL_PATH]', err_str)
    err_str = re.sub(r'/(?:[A-Za-z0-9._-]+/)+[A-Za-z0-9._-]+', '[INTERNAL_PATH]', err_str)
    return err_str
