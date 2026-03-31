from typing import Optional


class KyrazoError(Exception):
    """Base exception for all Kyrazo SDK errors."""

    def __init__(self, message: str, code: Optional[str] = None):
        super().__init__(message)
        self.code = code


class AuthenticationError(KyrazoError):
    """Raised when authentication fails (401)."""

    def __init__(self, message: str, code: str = "UNAUTHORIZED"):
        super().__init__(message, code=code)


class ForbiddenError(KyrazoError):
    """Raised when access is forbidden (403)."""

    def __init__(self, message: str, code: str = "ACCESS_DENIED"):
        super().__init__(message, code=code)


class ValidationError(KyrazoError):
    """Raised when input validation fails (400)."""

    def __init__(self, message: str, code: str = "INVALID_PAYLOAD", details: Optional[any] = None):
        super().__init__(message, code=code)
        self.details = details


class NotFoundError(KyrazoError):
    """Raised when a resource is not found (404)."""

    def __init__(self, message: str, code: str = "NOT_FOUND"):
        super().__init__(message, code=code)


class LimitExceededError(KyrazoError):
    """Raised when plan or rate limits are exceeded."""

    def __init__(
        self,
        message: str,
        code: str = "LIMIT_EXCEEDED",
        retry_after: Optional[int] = None,
        remaining: Optional[int] = None,
    ):
        super().__init__(message, code=code)
        self.retry_after = retry_after
        self.remaining = remaining


class RateLimitError(LimitExceededError):
    """Raised when rate limits are exceeded (429)."""

    def __init__(
        self,
        message: str,
        retry_after: Optional[int] = None,
        remaining: Optional[int] = None,
    ):
        super().__init__(
            message,
            code="RATE_LIMIT_EXCEEDED",
            retry_after=retry_after,
            remaining=remaining,
        )


class ConflictError(KyrazoError):
    """Raised when a resource state conflict occurs (409)."""

    def __init__(self, message: str, code: str = "CONFLICT"):
        super().__init__(message, code=code)


class ServerError(KyrazoError):
    """Raised when the server encounters an error (5xx)."""

    def __init__(self, message: str, code: str = "INTERNAL_ERROR"):
        super().__init__(message, code=code)


class NetworkError(KyrazoError):
    """Raised when a network error occurs."""

    def __init__(self, message: str):
        super().__init__(message, code="NETWORK_ERROR")
