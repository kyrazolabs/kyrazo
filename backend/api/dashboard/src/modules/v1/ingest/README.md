# Ingest

`backend/api/dashboard/src/modules/v1/ingest`

This folder holds accepting an inbound webhook and recording it for the dashboard API.

## Contents

### Files

- `ingest.controller.ts` — exports `IngestController`
- `ingest.ratelimiter.ts` — exports `ingestRateLimiter`
- `ingest.routes.ts`
- `ingest.schema.ts` — exports `GetIngestsEventsBySourceSchema`, `GetIngestEventsSchema`, `GetIngestsBySourceIdSchema`, `GetIngestsByEventIdSchema` and 4 more
- `ingest.type.ts` — exports `IGetIngestEventsResponse`, `IGetIngestEventResponse`

## License

Copyright (c) 2026 Kyrazo LLC. All rights reserved. You may not use this folder for a commercial or a non-commercial purpose without written permission from Kyrazo LLC. See the [repository license](../../../../../../../LICENSE).

The rules for changing this folder are in [CONTRIBUTING.md](CONTRIBUTING.md).
