import httpx
from typing import Optional, Any, Dict, Union
from .exceptions import (
    KyrazoError,
    AuthenticationError,
    ValidationError,
    LimitExceededError,
    RateLimitError,
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
                "User-Agent": "kyrazo-python-sdk/1.0.0",
            },
            timeout=timeout,
            transport=httpx.HTTPTransport(retries=retries),
        )

    def _handle_response(self, response: httpx.Response) -> Any:
        try:
            response.raise_for_status()
            if response.status_code == 204:
                return None
            return response.json()
        except httpx.HTTPStatusError as e:
            error_data = {}
            try:
                error_data = response.json()
            except Exception:
                pass

            message = error_data.get("error", {}).get("message", str(e))
            code = error_data.get("error", {}).get("code", "UNKNOWN_ERROR")

            if response.status_code == 400:
                raise ValidationError(message, code)
            elif response.status_code == 401:
                raise AuthenticationError(message, code)
            elif response.status_code == 403:
                raise LimitExceededError(message, code)
            elif response.status_code == 429:
                retry_after_header = response.headers.get("Retry-After")
                retry_after = (
                    int(retry_after_header)
                    if retry_after_header and retry_after_header.isdigit()
                    else None
                )

                remaining_header = response.headers.get("X-RateLimit-Remaining")
                remaining = (
                    int(remaining_header)
                    if remaining_header and remaining_header.isdigit()
                    else None
                )

                raise RateLimitError(
                    message, retry_after=retry_after, remaining=remaining
                )
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
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
    ) -> Any:
        try:
            response = self._client.request(
                method, path, json=data, params=params, headers=headers
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
        data: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
    ) -> Any:
        return self.request("POST", path, data=data, headers=headers)

    def put(self, path: str, data: Optional[Dict[str, Any]] = None) -> Any:
        return self.request("PUT", path, data=data)

    def patch(self, path: str, data: Optional[Dict[str, Any]] = None) -> Any:
        return self.request("PATCH", path, data=data)

    def delete(self, path: str) -> Any:
        return self.request("DELETE", path)

    def close(self):
        self._client.close()
