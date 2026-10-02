# V1

`backend/api/dashboard/src/modules/v1`

This folder holds version 1 routes and handlers for the dashboard API.

## Contents

### Folders

- [analytics](analytics/README.md) — delivery and ingest analytics
- [auth](auth/README.md) — sign-in, registration, and session handling
- [billing](billing/README.md) — plans, subscriptions, and payments
- [delivery](delivery/README.md) — outbound delivery attempts
- [endpoints](endpoints/README.md) — webhook endpoints
- [ingest](ingest/README.md) — accepting an inbound webhook and recording it
- [key](key/README.md) — API keys
- [namespace](namespace/README.md) — namespaces, the routing boundary a customer's events belong to
- [profile](profile/README.md) — the signed-in user's profile
- [source](source/README.md) — event sources that accept inbound webhooks
- [support](support/README.md) — support tickets
- [worker](worker/README.md) — worker registration and status
- [workspace](workspace/README.md) — workspaces, the tenant boundary

### Files

- `router.ts` — exports `AppType`

## License

Copyright (c) 2026 Kyrazo LLC. All rights reserved. You may not use this folder for a commercial or a non-commercial purpose without written permission from Kyrazo LLC. See the [repository license](../../../../../../LICENSE).

The rules for changing this folder are in [CONTRIBUTING.md](CONTRIBUTING.md).
