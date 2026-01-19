import pytest
import respx
from httpx import Response
from kyrazo import Kyrazo


@pytest.fixture
def api_key():
    return "test_api_key"


@pytest.fixture
def base_url():
    return "https://api.kyrazo.com"


@pytest.fixture
def client(api_key, base_url):
    return Kyrazo(api_key=api_key, base_url=base_url)


@pytest.fixture
def mock_api(base_url):
    with respx.mock(base_url=base_url) as respx_mock:
        yield respx_mock
