# Source

`backend/api/dashboard/src/modules/v1/source`

This folder holds event sources that accept inbound webhooks for the dashboard API.

## Contents

### Files

- `source.controller.ts` — exports `SourceController`
- `source.ratelimiter.ts` — exports `sourceReadRateLimiter`, `sourceWriteRateLimiter`
- `source.repo.ts` — exports `SourceRepository`, `sourceRepository`
- `source.routes.ts`
- `source.schema.ts` — exports `sourceStatus`, `sourceType`, `sourceService`, `sourceAuthType` and 4 more
- `source.service.ts` — exports `SourceService`
- `source.test.ts`
- `source.type.ts` — exports `CreateSourceResponse`, `DeleteSourceResponse`, `GetSourceResponse`, `GetSourcesResponse` and 1 more

## License

Copyright (c) 2026 Kyrazo LLC. All rights reserved. You may not use this folder for a commercial or a non-commercial purpose without written permission from Kyrazo LLC. See the [repository license](../../../../../../../LICENSE).

The rules for changing this folder are in [CONTRIBUTING.md](CONTRIBUTING.md).
