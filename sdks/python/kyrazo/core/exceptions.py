from typing import Optional, Any


class KyrazoError(Exception):
    """Base exception for all Kyrazo SDK errors."""

    def __init__(
        self,
        message: str,
        code: Optional[str] = None,
        status_code: Optional[int] = None,
        request_id: Optional[str] = None,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.request_id = request_id

    def __str__(self):
        return f"{self.message} (Code: {self.code}, Status: {self.status_code}, RequestID: {self.request_id})"


class AuthenticationError(KyrazoError):
    """Raised when authentication fails (401)."""

    def __init__(
        self,
        message: str = "Invalid or missing API key",
        code: str = "UNAUTHORIZED",
        request_id: Optional[str] = None,
    ):
        super().__init__(message, code=code, status_code=401, request_id=request_id)


class ForbiddenError(KyrazoError):
    """Raised when access is forbidden (403)."""

    def __init__(
        self,
        message: str = "Insufficient permissions",
        code: str = "ACCESS_DENIED",
        request_id: Optional[str] = None,
    ):
        super().__init__(message, code=code, status_code=403, request_id=request_id)


class ValidationError(KyrazoError):
    """Raised when input validation fails (400)."""

    def __init__(
        self,
        message: str,
        code: str = "INVALID_PAYLOAD",
        details: Optional[Any] = None,
        request_id: Optional[str] = None,
    ):
        super().__init__(message, code=code, status_code=400, request_id=request_id)
        self.details = details


class NotFoundError(KyrazoError):
    """Raised when a resource is not found (404)."""

    def __init__(
        self,
        message: str = "Resource not found",
        code: str = "NOT_FOUND",
        request_id: Optional[str] = None,
    ):
        super().__init__(message, code=code, status_code=404, request_id=request_id)


class LimitExceededError(KyrazoError):
    """Raised when plan limits are exceeded (403)."""

    def __init__(
        self,
        message: str = "Monthly event limit exceeded",
        code: str = "LIMIT_EXCEEDED",
        retry_after: Optional[int] = None,
        remaining: Optional[int] = None,
        request_id: Optional[str] = None,
    ):
        super().__init__(message, code=code, status_code=403, request_id=request_id)
        self.retry_after = retry_after
        self.remaining = remaining


class RateLimitError(LimitExceededError):
    """Raised when rate limits are exceeded (429)."""

    def __init__(
        self,
        message: str = "Rate limit exceeded. Please slow down.",
        retry_after: Optional[int] = None,
        remaining: Optional[int] = None,
        request_id: Optional[str] = None,
    ):
        super(LimitExceededError, self).__init__(
            message,
            code="RATE_LIMIT_EXCEEDED",
            status_code=429,
            request_id=request_id,
        )
        self.retry_after = retry_after
        self.remaining = remaining


class ConflictError(KyrazoError):
    """Raised when a resource state conflict occurs (409)."""

    def __init__(
        self,
        message: str = "Resource conflict",
        code: str = "CONFLICT",
        request_id: Optional[str] = None,
    ):
        super().__init__(message, code=code, status_code=409, request_id=request_id)


class ServerError(KyrazoError):
    """Raised when the server encounters an error (5xx)."""

    def __init__(
        self,
        message: str = "Internal server error",
        code: str = "INTERNAL_ERROR",
        request_id: Optional[str] = None,
    ):
        super().__init__(message, code=code, status_code=500, request_id=request_id)


class NetworkError(KyrazoError):
    """Raised when a network error occurs."""

    def __init__(self, message: str = "Network request failed", request_id: Optional[str] = None):
        super().__init__(message, code="NETWORK_ERROR", status_code=None, request_id=request_id)
