# Source

`backend/runtime/worker/src`

This folder holds the source files for the background worker.

## Contents

### Folders

- [app](app/README.md) — the application source
- [config](config/README.md) — startup configuration
- [consumers](consumers/README.md) — workers that take work off a queue
- [core](core/README.md) — cross-cutting code used by the rest of this package
- [services](services/README.md) — business logic and API clients
- [types](types/README.md) — shared types
- [utils](utils/README.md) — small helpers

### Files

- `bun.lock` — Bun lockfile
- `cluster.ts`
- `index.ts`
- `nats-cleanup.ts`
- `proxy.ts`
- `ui.ts`

## License

Copyright (c) 2026 Kyrazo LLC. All rights reserved. You may not use this folder for a commercial or a non-commercial purpose without written permission from Kyrazo LLC. See the [repository license](../../../../LICENSE).

The rules for changing this folder are in [CONTRIBUTING.md](CONTRIBUTING.md).
