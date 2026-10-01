import httpx
import uuid
import time
from typing import Optional, Any, Dict, Union, List
from .exceptions import (
    KyrazoError,
    AuthenticationError,
    ForbiddenError,
    ValidationError,
    NotFoundError,
    LimitExceededError,
    RateLimitError,
    ConflictError,
    ServerError,
    NetworkError,
)


class HttpClient:
    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.kyrazo.com",
        timeout: int = 30,
        retries: int = 3,
    ):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.timeout = timeout
        self.retries = retries
        self._client = httpx.Client(
            base_url=self.base_url,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "User-Agent": "kyrazo-python-sdk/1.2.0",
            },
            timeout=timeout,
        )

    def _get_rate_limit_info(self, response: httpx.Response, error_data: Dict[str, Any]):
        retry_after = error_data.get("retryAfter")
        remaining = error_data.get("remainingRequests")

        if retry_after is None:
            header_retry = response.headers.get("Retry-After")
            if header_retry and header_retry.isdigit():
                retry_after = int(header_retry)

        if remaining is None:
            header_remaining = response.headers.get("X-RateLimit-Remaining")
            if header_remaining and header_remaining.isdigit():
                remaining = int(header_remaining)

        return retry_after, remaining

    def _map_error(self, response: httpx.Response) -> KyrazoError:
        error_data = {}
        try:
            error_data = response.json().get("error", {})
        except Exception:
            pass

        message = error_data.get("message", response.text or "An unexpected error occurred")
        code = error_data.get("code", "UNKNOWN_ERROR")
        rid = error_data.get("requestId") or response.headers.get("x-request-id")
        details = error_data.get("details")

        # Map by error code first (more specific)
        if code in [
            "UNAUTHORIZED", "UNAUTHORIZED_USER", "UNAUTHORIZED_WORKSPACE",
            "AUTH_ERROR", "INVALID_TOKEN", "INVALID_API_KEY",
            "MISSING_TOKEN", "API_KEY_MISSING", "UNAUTORIZED_USER"
        ]:
            return AuthenticationError(message, code, rid)

        if code in [
            "ACCESS_DENIED", "INSUFFICIENT_PERMISSIONS", "INSUFFICIENT_KEY_ROLE",
            "INSUFFICIENT_WORKSPACE_ROLE", "WORKSPACE_ACCESS_DENIED",
            "NAMESPACE_ACCESS_DENIED", "IP_NOT_WHITELISTED",
            "OTP_REQUIRED", "OWNERSHIP_REQUIRED"
        ]:
            return ForbiddenError(message, code, rid)

        if code in ["LIMIT_EXCEEDED", "PLAN_LIMIT_EXCEEDED"]:
            retry_after, remaining = self._get_rate_limit_info(response, error_data)
            return LimitExceededError(message, code, retry_after, remaining, rid)

        if code == "RATE_LIMIT_EXCEEDED":
            retry_after, remaining = self._get_rate_limit_info(response, error_data)
            return RateLimitError(message, retry_after, remaining, rid)

        if code in [
            "INVALID_PAYLOAD", "BATCH_TOO_LARGE", "RATE_LIMIT_KEY_MISSING",
            "IDS_MISSING", "PROJECT_ID_MISSING", "RESOURCE_ID_MISSING",
            "WORKSPACE_ID_MISSING", "IDEMPOTENCY_KEY_REQUIRED", "BAD_REQUEST",
            "INVALID_CODE", "INVALID_STATUS", "INVALID_NAMESPACE",
            "INVALID_TEMP_TOKEN", "INVALID_CURRENT_PASSWORD", "GOOGLE_NO_EMAIL",
            "USER_EXISTS", "ENDPOINT_ALREADY_EXISTS", "TARGET_ALREADY_EXISTS",
            "FEATURE_NOT_AVAILABLE", "NO_VALID_TARGETS"
        ]:
            return ValidationError(message, code, details, rid)

        if code in [
            "NOT_FOUND", "NAMESPACE_NOT_FOUND", "SUBSCRIPTION_NOT_FOUND",
            "USER_NOT_FOUND", "WORKSPACE_NOT_FOUND", "WEBHOOK_NOT_FOUND",
            "PLAN_NOT_FOUND", "SESSION_NOT_FOUND"
        ]:
            return NotFoundError(message, code, rid)

        if code == "IDEMPOTENCY_CONFLICT":
            return ConflictError(message, code, rid)

        if code == "INTERNAL_ERROR" or code.endswith("_FAILED"):
            return ServerError(message, code, rid)

        # Fallback to status code
        if response.status_code == 400:
            return ValidationError(message, code, details, rid)
        if response.status_code == 401:
            return AuthenticationError(message, code, rid)
        if response.status_code == 403:
            return ForbiddenError(message, code, rid)
        if response.status_code == 404:
            return NotFoundError(message, code, rid)
        if response.status_code == 409:
            return ConflictError(message, code, rid)
        if response.status_code == 429:
            retry_after, remaining = self._get_rate_limit_info(response, error_data)
            return RateLimitError(message, retry_after, remaining, rid)
        if response.status_code >= 500:
            return ServerError(message, code, rid)

        return KyrazoError(message, code, response.status_code, rid)

    def request(
        self,
        method: str,
        path: str,
        data: Optional[Union[Dict[str, Any], List[Any]]] = None,
        params: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
    ) -> Any:
        # Initial request headers
        request_headers = {"Idempotency-Key": str(uuid.uuid4())}
        if headers:
            request_headers.update(headers)

        last_error = None
        for attempt in range(self.retries + 1):
            if attempt > 0:
                # Exponential backoff
                time.sleep((2 ** (attempt - 1)) * 0.1)

            try:
                response = self._client.request(
                    method, path, json=data, params=params, headers=request_headers
                )
                
                if response.status_code >= 200 and response.status_code < 300:
                    if response.status_code == 24:
                        return None
                    return response.json()

                # Error response - determine if we should retry
                error = self._map_error(response)
                
                # Retry on 5xx or 429
                should_retry = response.status_code >= 500 or response.status_code == 429
                if not should_retry or attempt >= self.retries:
                    raise error
                
                last_error = error
                
            except httpx.RequestError as e:
                if attempt >= self.retries:
                    raise NetworkError(f"Network error: {str(e)}")
                last_error = e
                continue
            except KyrazoError as e:
                # If we've already raised it above (non-retryable or max retries), it continues here
                raise e

        # All retries exhausted
        if isinstance(last_error, KyrazoError):
            raise last_error
        raise NetworkError(f"Request failed after retries: {str(last_error)}")

    def get(self, path: str, params: Optional[Dict[str, Any]] = None) -> Any:
        return self.request("GET", path, params=params)

    def post(
        self,
        path: str,
        data: Optional[Union[Dict[str, Any], List[Any]]] = None,
        headers: Optional[Dict[str, str]] = None,
    ) -> Any:
        return self.request("POST", path, data=data, headers=headers)

    def put(self, path: str, data: Optional[Union[Dict[str, Any], List[Any]]] = None) -> Any:
        return self.request("PUT", path, data=data)

    def patch(self, path: str, data: Optional[Union[Dict[str, Any], List[Any]]] = None) -> Any:
        return self.request("PATCH", path, data=data)

    def delete(self, path: str) -> Any:
        return self.request("DELETE", path)

    def close(self):
        self._client.close()
