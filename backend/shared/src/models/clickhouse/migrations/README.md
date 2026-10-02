# Migrations

`backend/shared/src/models/clickhouse/migrations`

This folder holds the migrations code for the shared backend library.

## Contents

### Files

- `001_create_delivery_attempts.ts` — exports `createDeliveryAttemptsTable`
- `002_create_dispatched_events.ts` — exports `createDispatchedEventsTable`
- `003_create_ingest_events.ts` — exports `createIngestEventsTable`
- `004_create_analytics_tables.ts` — exports `createAnalyticsTables`
- `index.ts` — exports `runMigrations`
- `utils.ts` — exports `runSqlFile`

## License

Copyright (c) 2026 Kyrazo LLC. All rights reserved. You may not use this folder for a commercial or a non-commercial purpose without written permission from Kyrazo LLC. See the [repository license](../../../../../../LICENSE).

The rules for changing this folder are in [CONTRIBUTING.md](CONTRIBUTING.md).
