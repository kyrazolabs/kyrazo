import hmac
import hashlib
import time
import pytest
from kyrazo import Webhook, ValidationError

def compute_signature(payload, timestamp, nonce, version, secret):
    signed_payload = f"{version}.{timestamp}.{nonce}.{payload}"
    return hmac.new(
        secret.encode(),
        signed_payload.encode(),
        hashlib.sha256
    ).hexdigest()

def test_verify_valid_signature():
    secret = "whsec_test_secret"
    payload = '{"event": "user.created"}'
    timestamp = str(int(time.time()))
    nonce = "test_nonce"
    version = "v1"
    
    signature = compute_signature(payload, timestamp, nonce, version, secret)
    headers = {
        "X-Webhook-Signature": f"v1={signature}",
        "X-Webhook-Timestamp": timestamp,
        "X-Webhook-Nonce": nonce,
        "X-Webhook-Version": version,
    }
    
    assert Webhook.verify(payload, headers, secret) is True

def test_verify_missing_headers():
    headers = {"X-Webhook-Timestamp": "123"}
    with pytest.raises(ValidationError, match="Missing required webhook headers"):
        Webhook.verify("{}", headers, "secret")

def test_verify_invalid_signature():
    secret = "whsec_test_secret"
    payload = '{"event": "user.created"}'
    timestamp = str(int(time.time()))
    nonce = "test_nonce"
    version = "v1"
    
    headers = {
        "X-Webhook-Signature": "v1=invalid_signature",
        "X-Webhook-Timestamp": timestamp,
        "X-Webhook-Nonce": nonce,
        "X-Webhook-Version": version,
    }
    
    with pytest.raises(ValidationError, match="Webhook signature verification failed"):
        Webhook.verify(payload, headers, secret)

def test_verify_expired_timestamp():
    secret = "whsec_test_secret"
    old_timestamp = str(int(time.time()) - 600) # 10 minutes ago
    nonce = "test_nonce"
    version = "v1"
    payload = "{}"
    
    signature = compute_signature(payload, old_timestamp, nonce, version, secret)
    headers = {
        "X-Webhook-Signature": f"v1={signature}",
        "X-Webhook-Timestamp": old_timestamp,
        "X-Webhook-Nonce": nonce,
        "X-Webhook-Version": version,
    }
    
    with pytest.raises(ValidationError, match="Webhook timestamp expired or invalid"):
        Webhook.verify(payload, headers, secret)

def test_verify_custom_tolerance():
    secret = "whsec_test_secret"
    old_timestamp = str(int(time.time()) - 600)
    nonce = "test_nonce"
    version = "v1"
    payload = "{}"
    
    signature = compute_signature(payload, old_timestamp, nonce, version, secret)
    headers = {
        "X-Webhook-Signature": f"v1={signature}",
        "X-Webhook-Timestamp": old_timestamp,
        "X-Webhook-Nonce": nonce,
        "X-Webhook-Version": version,
    }
    
    assert Webhook.verify(payload, headers, secret, tolerance=1200) is True
