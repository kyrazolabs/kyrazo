# Middleware

`backend/services/loadbalancer/src/middleware`

This folder holds HTTP middleware that runs before the handler for the Rust load balancer.

## Contents

### Files

- `mod.rs`
- `rate_limiter.rs` — exports `RateLimiter`
- `retry.rs` — exports `RetryPolicy`

## License

Copyright (c) 2026 Kyrazo LLC. All rights reserved. You may not use this folder for a commercial or a non-commercial purpose without written permission from Kyrazo LLC. See the [repository license](../../../../../LICENSE).

The rules for changing this folder are in [CONTRIBUTING.md](CONTRIBUTING.md).
