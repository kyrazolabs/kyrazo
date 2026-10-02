# Source

`backend/services/ingestor/src`

This folder holds the source files for the ClickHouse ingestor.

## Contents

### Folders

- [aggregators](aggregators/README.md) — the aggregators code
- [consumers](consumers/README.md) — workers that take work off a queue
- [db](db/README.md) — the db code
- [retention](retention/README.md) — the retention code
- [types](types/README.md) — shared types

### Files

- `cluster.ts`
- `config.ts` — exports `Config`
- `index.ts`

## License

Copyright (c) 2026 Kyrazo LLC. All rights reserved. You may not use this folder for a commercial or a non-commercial purpose without written permission from Kyrazo LLC. See the [repository license](../../../../LICENSE).

The rules for changing this folder are in [CONTRIBUTING.md](CONTRIBUTING.md).
