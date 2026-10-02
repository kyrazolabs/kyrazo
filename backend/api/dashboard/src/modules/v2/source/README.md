# Source

`backend/api/dashboard/src/modules/v2/source`

This folder holds event sources that accept inbound webhooks for the dashboard API.

## Contents

### Files

- `source.controller.test.ts`
- `source.controller.ts` — exports `SourceControllerV2`
- `source.ratelimiter.ts` — exports `sourceReadRateLimiter`, `sourceWriteRateLimiter`
- `source.repo.test.ts`
- `source.repo.ts` — exports `SourceRepositoryV2`, `sourceRepositoryV2`
- `source.routes.ts`
- `source.schema.ts` — exports `CreateSourceSchema`, `UpdateSourceSchema`, `SourceIdParamSchema`, `SearchSourceSchema`
- `source.service.test.ts`
- `source.service.ts` — exports `SourceServiceV2`
- `source.types.ts` — exports `CreateSourceDto`, `UpdateSourceDto`, `SearchSourceDto`, `SourceIdParamDto` and 5 more

## License

Copyright (c) 2026 Kyrazo LLC. All rights reserved. You may not use this folder for a commercial or a non-commercial purpose without written permission from Kyrazo LLC. See the [repository license](../../../../../../../LICENSE).

The rules for changing this folder are in [CONTRIBUTING.md](CONTRIBUTING.md).
