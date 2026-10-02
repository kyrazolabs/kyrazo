# Contributing to `backend/services/loadbalancer`

This folder is part of Kyrazo, proprietary software owned by Kyrazo LLC. The [repository license](../../../LICENSE) and the [repository contributing guide](../../../CONTRIBUTING.md) apply here.

Do not use, copy, or change anything in this folder unless Kyrazo LLC has given you written permission. That rule covers commercial use and non-commercial use. A pull request is not permission, and it does not give you a license to the code. Write to [legal@kyrazo.com](mailto:legal@kyrazo.com).

## This folder

The Rust load balancer spreads inbound traffic across API instances and exposes health checks.

- Branch from `develop` and open the pull request against `develop`.
- Keep the diff inside `backend/services/loadbalancer` unless the change cannot work without a neighboring folder.
- Match the style of the files already in this folder.
- Do not commit secrets, credentials, or `.env` files.

## Checks

From `backend/services/loadbalancer`:

```bash
cargo test
```

## Nearby docs

- [README for this folder](README.md)
- [Parent folder](../README.md)
- [Repository contributing guide](../../../CONTRIBUTING.md)
