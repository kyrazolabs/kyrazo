from typing import Optional, Any


class KyrazoError(Exception):
    """Base exception for all Kyrazo SDK errors."""

    def __init__(self, message: str, code: Optional[str] = None):
        super().__init__(message)
        self.code = code


class AuthenticationError(KyrazoError):
    """Raised when authentication fails (401)."""

    pass


class ValidationError(KyrazoError):
    """Raised when input validation fails (400)."""

    pass


class LimitExceededError(KyrazoError):
    """Raised when plan limits are exceeded (403)."""

    pass


class RateLimitError(KyrazoError):
    """Raised when rate limits are exceeded (429)."""

    def __init__(
        self,
        message: str,
        retry_after: Optional[int] = None,
        remaining: Optional[int] = None,
    ):
        super().__init__(message, code="RATE_LIMIT_EXCEEDED")
        self.retry_after = retry_after
        self.remaining = remaining


class ServerError(KyrazoError):
    """Raised when the server encounters an error (5xx)."""

    pass


class NetworkError(KyrazoError):
    """Raised when a network error occurs."""

    pass
