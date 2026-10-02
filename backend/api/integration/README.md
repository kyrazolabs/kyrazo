# Integration

`backend/api/integration`

The integration API is the customer-facing API for sources, endpoints, namespaces, transforms, S3, and ASQS. Server SDKs call this service. It is a Bun and Hono service.

## Contents

### Folders

- [scripts](scripts/README.md) — maintenance scripts
- [src](src/README.md) — the source files

### Files

- `Dockerfile` — image build
- `bun.lock` — Bun lockfile
- `docker-compose.yml`
- `eslint.config.mts` — ESLint config
- `package.json` — package manifest and scripts
- `tsconfig.json` — TypeScript project config

## License

Copyright (c) 2026 Kyrazo LLC. All rights reserved. You may not use this folder for a commercial or a non-commercial purpose without written permission from Kyrazo LLC. See the [repository license](../../../LICENSE).

The rules for changing this folder are in [CONTRIBUTING.md](CONTRIBUTING.md).
