import pytest
from httpx import Response
from kyrazo import Kyrazo, KyrazoError, AuthenticationError
from kyrazo.core.http_client import HttpClient


def test_client_init():
    client = Kyrazo(api_key="test")
    assert isinstance(client._http_client, HttpClient)
    assert client.events is not None


def test_context_manager():
    with Kyrazo(api_key="test") as client:
        assert isinstance(client, Kyrazo)
    # Underlying client should be closed (though httpx client usage check is internal)


def test_auth_error(client, mock_api):
    mock_api.get("/v1/test").mock(
        return_value=Response(401, json={"error": {"message": "Invalid API Key"}})
    )

    with pytest.raises(AuthenticationError):
        client._http_client.get("/v1/test")
