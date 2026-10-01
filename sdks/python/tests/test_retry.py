import pytest
import respx
import httpx
import time
from kyrazo.core.http_client import HttpClient
from kyrazo.core.exceptions import RateLimitError, ServerError, NetworkError


@respx.mock
def test_retry_on_500_success_eventually():
    client = HttpClient(api_key="test_key", retries=2)
    
    # Mock sequence: 500, 500, 200
    route = respx.get("https://api.kyrazo.com/test")
    route.side_effect = [
        httpx.Response(500, json={"error": {"code": "INTERNAL_ERROR", "message": "Fail"}}),
        httpx.Response(500, json={"error": {"code": "INTERNAL_ERROR", "message": "Fail"}}),
        httpx.Response(200, json={"success": True}),
    ]
    
    # We need to mock time.sleep to avoid waiting in tests
    with pytest.MonkeyPatch.context() as mp:
        mp.setattr(time, "sleep", lambda x: None)
        response = client.get("/test")
    
    assert response["success"] is True
    assert route.call_count == 3


@respx.mock
def test_retry_on_429():
    client = HttpClient(api_key="test_key", retries=2)
    
    route = respx.get("https://api.kyrazo.com/test")
    route.side_effect = [
        httpx.Response(429, json={"error": {"code": "RATE_LIMIT_EXCEEDED", "message": "Slow down"}}),
        httpx.Response(200, json={"success": True}),
    ]
    
    with pytest.MonkeyPatch.context() as mp:
        mp.setattr(time, "sleep", lambda x: None)
        response = client.get("/test")
    
    assert response["success"] is True
    assert route.call_count == 2


@respx.mock
def test_retry_exhausted():
    client = HttpClient(api_key="test_key", retries=1)
    
    route = respx.get("https://api.kyrazo.com/test")
    route.side_effect = [
        httpx.Response(500, json={"error": {"code": "INTERNAL_ERROR", "message": "Fail"}}),
        httpx.Response(500, json={"error": {"code": "INTERNAL_ERROR", "message": "Fail"}}),
    ]
    
    with pytest.MonkeyPatch.context() as mp:
        mp.setattr(time, "sleep", lambda x: None)
        with pytest.raises(ServerError) as excinfo:
            client.get("/test")
    
    assert excinfo.value.code == "INTERNAL_ERROR"
    assert route.call_count == 2


@respx.mock
def test_idempotency_key_persistence_across_retries():
    client = HttpClient(api_key="test_key", retries=1)
    
    idempotency_keys = []

    def handle_request(request):
        idempotency_keys.append(request.headers.get("Idempotency-Key"))
        return httpx.Response(500, json={"error": {"code": "FAIL"}})

    route = respx.post("https://api.kyrazo.com/test").mock(side_effect=handle_request)
    
    with pytest.MonkeyPatch.context() as mp:
        mp.setattr(time, "sleep", lambda x: None)
        with pytest.raises(ServerError):
            client.post("/test")
    
    assert len(idempotency_keys) == 2
    assert idempotency_keys[0] == idempotency_keys[1]
    assert len(idempotency_keys[0]) == 36 # UUID length
