# Targets

`backend/api/integration/src/modules/v1/targets`

This folder holds delivery targets for the integration API.

## Contents

### Files

- `target.controller.ts` — exports `TargetController`
- `target.rate-limiter.ts` — exports `targetReadRateLimiter`, `targetWriteRateLimiter`
- `target.repo.ts` — exports `TargetRepository`, `targetRepository`
- `target.routes.ts`
- `target.schema.ts` — exports `CreateTargetSchema`, `UpdateTargetSchema`, `UpdateTargetStatusSchema`, `SearchTargetSchema` and 6 more
- `target.service.ts` — exports `TargetService`
- `target.types.ts` — exports `CreateTargetResponse`, `GetTargetsResponse`, `GetTargetByIdResponse`, `GetTargetSecretResponse` and 2 more

## License

Copyright (c) 2026 Kyrazo LLC. All rights reserved. You may not use this folder for a commercial or a non-commercial purpose without written permission from Kyrazo LLC. See the [repository license](../../../../../../../LICENSE).

The rules for changing this folder are in [CONTRIBUTING.md](CONTRIBUTING.md).
