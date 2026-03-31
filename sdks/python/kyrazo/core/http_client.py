import httpx
import uuid
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
                "User-Agent": "kyrazo-python-sdk/1.1.0",
            },
            timeout=timeout,
            transport=httpx.HTTPTransport(retries=retries),
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

    def _handle_response(self, response: httpx.Response) -> Any:
        try:
            response.raise_for_status()
            if response.status_code == 204:
                return None
            return response.json()
        except httpx.HTTPStatusError as e:
            error_data_body = {}
            try:
                error_data_body = response.json()
            except Exception:
                pass

            error_info = error_data_body.get("error", {})
            message = error_info.get("message", str(e))
            code = error_info.get("code", "UNKNOWN_ERROR")
            details = error_info.get("details")

            # Map by error code first (more specific)
            
            # 401 Unauthorized
            if code in [
                "UNAUTHORIZED", "UNAUTHORIZED_USER", "UNAUTHORIZED_WORKSPACE",
                "AUTH_ERROR", "INVALID_TOKEN", "INVALID_API_KEY",
                "MISSING_TOKEN", "API_KEY_MISSING", "UNAUTORIZED_USER"
            ]:
                raise AuthenticationError(message, code)

            # 403 Forbidden / RBAC
            if code in [
                "ACCESS_DENIED", "INSUFFICIENT_PERMISSIONS", "INSUFFICIENT_KEY_ROLE",
                "INSUFFICIENT_WORKSPACE_ROLE", "WORKSPACE_ACCESS_DENIED",
                "NAMESPACE_ACCESS_DENIED", "IP_NOT_WHITELISTED",
                "OTP_REQUIRED", "OWNERSHIP_REQUIRED"
            ]:
                raise ForbiddenError(message, code)

            # 403/429 Limits
            if code in ["LIMIT_EXCEEDED", "PLAN_LIMIT_EXCEEDED"]:
                retry_after, remaining = self._get_rate_limit_info(response, error_info)
                raise LimitExceededError(message, code, retry_after, remaining)

            if code == "RATE_LIMIT_EXCEEDED":
                retry_after, remaining = self._get_rate_limit_info(response, error_info)
                raise RateLimitError(message, retry_after, remaining)

            # 400 Validation
            if code in [
                "INVALID_PAYLOAD", "BATCH_TOO_LARGE", "RATE_LIMIT_KEY_MISSING",
                "IDS_MISSING", "PROJECT_ID_MISSING", "RESOURCE_ID_MISSING",
                "WORKSPACE_ID_MISSING", "IDEMPOTENCY_KEY_REQUIRED", "BAD_REQUEST",
                "INVALID_CODE", "INVALID_STATUS", "INVALID_NAMESPACE",
                "INVALID_TEMP_TOKEN", "INVALID_CURRENT_PASSWORD", "GOOGLE_NO_EMAIL",
                "USER_EXISTS", "ENDPOINT_ALREADY_EXISTS", "TARGET_ALREADY_EXISTS",
                "FEATURE_NOT_AVAILABLE", "NO_VALID_TARGETS"
            ]:
                raise ValidationError(message, code, details)

            # 404 Not Found
            if code in [
                "NOT_FOUND", "NAMESPACE_NOT_FOUND", "SUBSCRIPTION_NOT_FOUND",
                "USER_NOT_FOUND", "WORKSPACE_NOT_FOUND", "WEBHOOK_NOT_FOUND",
                "PLAN_NOT_FOUND", "SESSION_NOT_FOUND"
            ]:
                raise NotFoundError(message, code)

            # 409 Conflict
            if code == "IDEMPOTENCY_CONFLICT":
                raise ConflictError(message, code)

            # 500 Internal Server Error / Functional Failures
            if code == "INTERNAL_ERROR" or code.endswith("_FAILED"):
                raise ServerError(message, code)

            # Fallback to status code mapping
            if response.status_code == 400:
                raise ValidationError(message, code, details)
            elif response.status_code == 401:
                raise AuthenticationError(message, code)
            elif response.status_code == 403:
                # Distinguish limits vs permissions based on code if generic
                if code in ["LIMIT_EXCEEDED", "PLAN_LIMIT_EXCEEDED"]:
                     retry_after, remaining = self._get_rate_limit_info(response, error_info)
                     raise LimitExceededError(message, code, retry_after, remaining)
                raise ForbiddenError(message, code)
            elif response.status_code == 404:
                raise NotFoundError(message, code)
            elif response.status_code == 409:
                raise ConflictError(message, code)
            elif response.status_code == 429:
                retry_after, remaining = self._get_rate_limit_info(response, error_info)
                raise RateLimitError(message, retry_after, remaining)
            elif response.status_code >= 500:
                raise ServerError(message, code)
            else:
                raise KyrazoError(message, code)

        except httpx.NetworkError as e:
            raise NetworkError(f"Network error: {str(e)}")

    def request(
        self,
        method: str,
        path: str,
        data: Optional[Union[Dict[str, Any], List[Any]]] = None,
        params: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
    ) -> Any:
        # Generate a unique idempotency key for every request
        request_headers = {"Idempotency-Key": str(uuid.uuid4())}
        if headers:
            request_headers.update(headers)

        try:
            response = self._client.request(
                method, path, json=data, params=params, headers=request_headers
            )
            return self._handle_response(response)
        except Exception as e:
            # Re-raise if it's already a KyrazoError, otherwise wrap it
            if isinstance(e, KyrazoError):
                raise e
            raise NetworkError(f"Request failed: {str(e)}")

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
