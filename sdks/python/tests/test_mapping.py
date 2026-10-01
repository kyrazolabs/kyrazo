import pytest
import httpx
from kyrazo.core.http_client import HttpClient
from kyrazo.core.exceptions import (
    AuthenticationError,
    ValidationError,
    RateLimitError,
    NotFoundError,
    ForbiddenError,
    ServerError,
    LimitExceededError,
    ConflictError,
    KyrazoError,
)


def test_map_unauthorized_code():
    client = HttpClient(api_key="test_key")
    response = httpx.Response(401, json={
        "error": {"code": "UNAUTHORIZED", "message": "Invalid key", "requestId": "req_1"}
    })
    error = client._map_error(response)
    assert isinstance(error, AuthenticationError)
    assert error.code == "UNAUTHORIZED"
    assert error.request_id == "req_1"
    assert error.status_code == 401


def test_map_rate_limit_with_retry_info():
    client = HttpClient(api_key="test_key")
    response = httpx.Response(429, json={
        "error": {
            "code": "RATE_LIMIT_EXCEEDED",
            "message": "Too fast",
            "retryAfter": 30,
            "remainingRequests": 0,
            "requestId": "req_2"
        }
    })
    error = client._map_error(response)
    assert isinstance(error, RateLimitError)
    assert error.retry_after == 30
    assert error.remaining == 0


def test_map_rate_limit_from_headers():
    client = HttpClient(api_key="test_key")
    response = httpx.Response(429, 
        headers={"Retry-After": "45", "X-RateLimit-Remaining": "5"},
        json={"error": {"code": "RATE_LIMIT_EXCEEDED", "message": "Too fast"}}
    )
    error = client._map_error(response)
    assert isinstance(error, RateLimitError)
    assert error.retry_after == 45
    assert error.remaining == 5


def test_map_validation_with_details():
    client = HttpClient(api_key="test_key")
    details = [{"field": "email", "reason": "invalid"}]
    response = httpx.Response(400, json={
        "error": {"code": "INVALID_PAYLOAD", "message": "Bad input", "details": details}
    })
    error = client._map_error(response)
    assert isinstance(error, ValidationError)
    assert error.details == details


def test_map_limit_exceeded():
    client = HttpClient(api_key="test_key")
    response = httpx.Response(403, json={
        "error": {"code": "LIMIT_EXCEEDED", "message": "Plan limit"}
    })
    error = client._map_error(response)
    assert isinstance(error, LimitExceededError)
    assert error.status_code == 403


def test_fallback_to_status_code():
    client = HttpClient(api_key="test_key")
    # Custom code that we don't handle explicitly yet
    response = httpx.Response(404, json={
        "error": {"code": "CUSTOM_NOT_FOUND", "message": "Hidden resource"}
    })
    error = client._map_error(response)
    assert isinstance(error, NotFoundError)
    assert error.code == "CUSTOM_NOT_FOUND"


def test_handle_malformed_json():
    client = HttpClient(api_key="test_key")
    response = httpx.Response(500, content=b"Internal Server Error", headers={"x-request-id": "req_99"})
    error = client._map_error(response)
    assert isinstance(error, ServerError)
    assert error.request_id == "req_99"


def test_backend_typo_fallback():
    client = HttpClient(api_key="test_key")
    # Backend has a typo mentioned in JS SDK
    response = httpx.Response(401, json={
        "error": {"code": "UNAUTORIZED_USER", "message": "Typo key"}
    })
    error = client._map_error(response)
    assert isinstance(error, AuthenticationError)
