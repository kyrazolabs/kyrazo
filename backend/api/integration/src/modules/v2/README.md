# V2

`backend/api/integration/src/modules/v2`

This folder holds version 2 routes and handlers for the integration API.

## Contents

### Folders

- [asqs](asqs/README.md) — ASQS queues, the managed queue destination
- [endpoint](endpoint/README.md) — webhook endpoints
- [namespace](namespace/README.md) — namespaces, the routing boundary a customer's events belong to
- [s3](s3/README.md) — S3 bucket destinations
- [source](source/README.md) — event sources that accept inbound webhooks
- [transform](transform/README.md) — payload transforms

### Files

- `router.ts` — exports `AppType`

## License

Copyright (c) 2026 Kyrazo LLC. All rights reserved. You may not use this folder for a commercial or a non-commercial purpose without written permission from Kyrazo LLC. See the [repository license](../../../../../../LICENSE).

The rules for changing this folder are in [CONTRIBUTING.md](CONTRIBUTING.md).
