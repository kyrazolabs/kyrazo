# Tests

`sdks/python/tests`

This folder holds tests for the Python SDK.

## Contents

### Folders

- [resources](resources/README.md) — API resource clients

### Files

- `conftest.py` — exports `api_key`, `base_url`, `client`, `mock_api`
- `test_client.py` — exports `test_client_init`, `test_context_manager`, `test_auth_error`
- `test_exceptions.py` — exports `test_handle_response_401_authentication_error`, `test_handle_response_403_forbidden_error`, `test_handle_response_403_limit_exceeded_error`, `test_handle_response_429_rate_limit_error` and 6 more
- `test_mapping.py` — exports `test_map_unauthorized_code`, `test_map_rate_limit_with_retry_info`, `test_map_rate_limit_from_headers`, `test_map_validation_with_details` and 4 more
- `test_retry.py` — exports `test_retry_on_500_success_eventually`, `test_retry_on_429`, `test_retry_exhausted`, `test_idempotency_key_persistence_across_retries`
- `test_webhook.py` — exports `compute_signature`, `test_verify_valid_signature`, `test_verify_missing_headers`, `test_verify_invalid_signature` and 2 more

## License

Copyright (c) 2026 Kyrazo LLC. All rights reserved. You may not use this folder for a commercial or a non-commercial purpose without written permission from Kyrazo LLC. See the [repository license](../../../LICENSE).

The rules for changing this folder are in [CONTRIBUTING.md](CONTRIBUTING.md).
