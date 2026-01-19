from typing import Optional
from .core.http_client import HttpClient
from .resources.events.client import EventsClient
from .resources.sources.client import SourcesClient
from .resources.endpoints.client import EndpointsClient
from .resources.targets.client import TargetsClient


class Kyrazo:
    """
    Main Kyrazo SDK Client.
    """

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.kyrazo.com",
        timeout: int = 30,
        retries: int = 3,
    ):
        self._http_client = HttpClient(api_key, base_url, timeout, retries)

        # Initialize modules
        self.events = EventsClient(self._http_client)
        self.sources = SourcesClient(self._http_client)
        self.endpoints = EndpointsClient(self._http_client)
        self.targets = TargetsClient(self._http_client)

    def close(self):
        """Close the underlying HTTP client."""
        self._http_client.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
