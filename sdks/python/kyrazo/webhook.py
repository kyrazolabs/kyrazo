import hmac
import hashlib
import time
from typing import Dict, Optional, Union
from .core.exceptions import ValidationError

class Webhook:
    """
    Webhook utilities for verifying authenticity of incoming requests.
    """
    
    HEADERS = {
        "SIGNATURE": "X-Webhook-Signature",
        "TIMESTAMP": "X-Webhook-Timestamp",
        "NONCE": "X-Webhook-Nonce",
        "VERSION": "X-Webhook-Version",
    }

    @staticmethod
    def verify(
        payload: str,
        headers: Dict[str, Union[str, list]],
        secret: str,
        tolerance: int = 300,
    ) -> bool:
        """
        Verify a webhook signature.
        
        Args:
            payload: The raw request body string.
            headers: The incoming request headers.
            secret: The signing secret for the target.
            tolerance: Maximum allowed age of the request in seconds (default: 300).
            
        Returns:
            True if the signature is valid.
            
        Raises:
            ValidationError: If verification fails.
        """
        # Normalize header keys to PascalCase or lowercase for robustness
        header_map = {k.lower(): v for k, v in headers.items()}
        
        sig_header = header_map.get(Webhook.HEADERS["SIGNATURE"].lower())
        timestamp = header_map.get(Webhook.HEADERS["TIMESTAMP"].lower())
        nonce = header_map.get(Webhook.HEADERS["NONCE"].lower())
        version = header_map.get(Webhook.HEADERS["VERSION"].lower())

        if not all([sig_header, timestamp, nonce, version]):
            raise ValidationError("Missing required webhook headers")

        if isinstance(sig_header, list): sig_header = sig_header[0]
        if isinstance(timestamp, list): timestamp = timestamp[0]
        if isinstance(nonce, list): nonce = nonce[0]
        if isinstance(version, list): version = version[0]

        # Verify timestamp tolerance to prevent replay attacks
        try:
            ts = int(timestamp)
        except ValueError:
            raise ValidationError("Invalid webhook timestamp format")
            
        now = int(time.time())
        if abs(now - ts) > tolerance:
            raise ValidationError("Webhook timestamp expired or invalid")

        # signature format is "v1={hash}"
        if "=" not in sig_header:
            raise ValidationError("Invalid webhook signature format")
            
        header_version, signature = sig_header.split("=", 1)
        if header_version != "v1" or not signature:
            raise ValidationError("Invalid webhook signature version or format")

        # Construct payload: version.timestamp.nonce.body
        signed_payload = f"{version}.{timestamp}.{nonce}.{payload}"

        # Compute expected HMAC
        expected_signature = hmac.new(
            secret.encode(),
            signed_payload.encode(),
            hashlib.sha256
        ).hexdigest()

        # Use timing-safe comparison
        if hmac.compare_digest(signature, expected_signature):
            return True

        raise ValidationError("Webhook signature verification failed")
