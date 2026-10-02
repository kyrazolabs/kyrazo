# Utils

`backend/shared/src/utils`

This folder holds small helpers for the shared backend library.

## Contents

### Folders

- [libs](libs/README.md) — low-level helpers and third-party wrappers

### Files

- `constants.ts` — exports `FREE_PLAN_LIMITS`, `FREE_PLAN_FEATURES`, `DEFAULT_FREE_SUBSCRIPTION`
- `helper.ts` — exports `generateIngressId`, `base62Encode`, `base62Decode`, `safeEncode` and 2 more
- `id.test.ts`
- `id.ts` — exports `ID_PREFIXES`, `IdType`, `prefixId`, `unprefixId` and 3 more
- `index.ts`
- `nats.ts` — exports `getNatsSubject`, `getNatsDurableName`
- `performance.ts` — exports `PerformanceTimer`, `measureAsync`, `measure`, `timed` and 1 more
- `redis-keys.ts` — exports `RedisKeys`
- `s3-config.ts` — exports `S3ConfigInput`, `buildS3Config`
- `snowflake.ts` — exports `snowflake`

## License

Copyright (c) 2026 Kyrazo LLC. All rights reserved. You may not use this folder for a commercial or a non-commercial purpose without written permission from Kyrazo LLC. See the [repository license](../../../../LICENSE).

The rules for changing this folder are in [CONTRIBUTING.md](CONTRIBUTING.md).
