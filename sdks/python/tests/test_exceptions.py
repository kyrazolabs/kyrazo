import pytest
import httpx
from kyrazo.core.http_client import HttpClient
from kyrazo.core.exceptions import (
    AuthenticationError,
    ForbiddenError,
    ValidationError,
    NotFoundError,
    LimitExceededError,
    RateLimitError,
    ConflictError,
    ServerError,
    KyrazoError,
)

def test_handle_response_401_authentication_error():
    client = HttpClient(api_key="test")
    response = httpx.Response(
        401,
        json={"success": False, "error": {"code": "INVALID_TOKEN", "message": "Invalid token"}},
        request=httpx.Request("GET", "https://api.kyrazo.com/test")
    )
    
    with pytest.raises(AuthenticationError) as excinfo:
        error = client._map_error(response)
        raise error
    assert excinfo.value.code == "INVALID_TOKEN"

def test_handle_response_403_forbidden_error():
    client = HttpClient(api_key="test")
    response = httpx.Response(
        403,
        json={"success": False, "error": {"code": "INSUFFICIENT_PERMISSIONS", "message": "Forbidden"}},
        request=httpx.Request("GET", "https://api.kyrazo.com/test")
    )
    
    with pytest.raises(ForbiddenError) as excinfo:
        error = client._map_error(response)
        raise error
    assert excinfo.value.code == "INSUFFICIENT_PERMISSIONS"

def test_handle_response_403_limit_exceeded_error():
    client = HttpClient(api_key="test")
    response = httpx.Response(
        403,
        json={"success": False, "error": {"code": "LIMIT_EXCEEDED", "message": "Limit reached"}},
        request=httpx.Request("GET", "https://api.kyrazo.com/test")
    )
    
    with pytest.raises(LimitExceededError) as excinfo:
        error = client._map_error(response)
        raise error
    assert excinfo.value.code == "LIMIT_EXCEEDED"

def test_handle_response_429_rate_limit_error():
    client = HttpClient(api_key="test")
    response = httpx.Response(
        429,
        headers={"Retry-After": "60", "X-RateLimit-Remaining": "0"},
        json={"success": False, "error": {"code": "RATE_LIMIT_EXCEEDED", "message": "Rate limited"}},
        request=httpx.Request("GET", "https://api.kyrazo.com/test")
    )
    
    with pytest.raises(RateLimitError) as excinfo:
        error = client._map_error(response)
        raise error
    assert excinfo.value.retry_after == 60
    assert excinfo.value.remaining == 0

def test_handle_response_400_validation_error():
    client = HttpClient(api_key="test")
    response = httpx.Response(
        400,
        json={"success": False, "error": {"code": "INVALID_PAYLOAD", "message": "Invalid", "details": {"field": "missing"}}},
        request=httpx.Request("POST", "https://api.kyrazo.com/test")
    )
    
    with pytest.raises(ValidationError) as excinfo:
        error = client._map_error(response)
        raise error
    assert excinfo.value.details == {"field": "missing"}

def test_handle_response_404_not_found_error():
    client = HttpClient(api_key="test")
    response = httpx.Response(
        404,
        json={"success": False, "error": {"code": "PLAN_NOT_FOUND", "message": "Not found"}},
        request=httpx.Request("GET", "https://api.kyrazo.com/test")
    )
    
    with pytest.raises(NotFoundError) as excinfo:
        error = client._map_error(response)
        raise error
    assert excinfo.value.code == "PLAN_NOT_FOUND"

def test_handle_response_409_conflict_error():
    client = HttpClient(api_key="test")
    response = httpx.Response(
        409,
        json={"success": False, "error": {"code": "IDEMPOTENCY_CONFLICT", "message": "Conflict"}},
        request=httpx.Request("POST", "https://api.kyrazo.com/test")
    )
    
    with pytest.raises(ConflictError) as excinfo:
        error = client._map_error(response)
        raise error
    assert excinfo.value.code == "IDEMPOTENCY_CONFLICT"

def test_handle_response_500_server_error():
    client = HttpClient(api_key="test")
    response = httpx.Response(
        500,
        json={"success": False, "error": {"code": "CREATE_NAMESPACE_FAILED", "message": "Failed"}},
        request=httpx.Request("POST", "https://api.kyrazo.com/test")
    )
    
    with pytest.raises(ServerError) as excinfo:
        error = client._map_error(response)
        raise error
    assert excinfo.value.code == "CREATE_NAMESPACE_FAILED"

def test_handle_response_typo_fallback():
    client = HttpClient(api_key="test")
    response = httpx.Response(
        401,
        json={"success": False, "error": {"code": "UNAUTORIZED_USER", "message": "Typo"}},
        request=httpx.Request("GET", "https://api.kyrazo.com/test")
    )
    
    with pytest.raises(AuthenticationError):
        error = client._map_error(response)
        raise error

def test_handle_response_unknown_fallback():
    client = HttpClient(api_key="test")
    response = httpx.Response(
        418,
        json={"success": False, "error": {"code": "IM_A_TEAPOT", "message": "Teapot"}},
        request=httpx.Request("GET", "https://api.kyrazo.com/test")
    )
    
    with pytest.raises(KyrazoError) as excinfo:
        error = client._map_error(response)
        raise error
    assert excinfo.value.code == "IM_A_TEAPOT"
