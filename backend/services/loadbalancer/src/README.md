# Source

`backend/services/loadbalancer/src`

This folder holds the source files for the Rust load balancer.

## Contents

### Folders

- [health](health/README.md) — health checks
- [middleware](middleware/README.md) — HTTP middleware that runs before the handler
- [rules](rules/README.md) — routing rules
- [strategy](strategy/README.md) — load-balancing strategies

### Files

- `balancer.rs` — exports `Balancer`
- `config.rs` — exports `Config`, `ServerConfig`, `default_max_connections`, `BackendConfig` and 17 more
- `forwarder.rs` — exports `build_client`, `NoVerifier`, `ForwardResult`
- `main.rs` — exports `Cli`, `main`
- `metrics.rs` — exports `encode_metrics`

## License

Copyright (c) 2026 Kyrazo LLC. All rights reserved. You may not use this folder for a commercial or a non-commercial purpose without written permission from Kyrazo LLC. See the [repository license](../../../../LICENSE).

The rules for changing this folder are in [CONTRIBUTING.md](CONTRIBUTING.md).
