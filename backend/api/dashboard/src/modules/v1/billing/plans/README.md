# Plans

`backend/api/dashboard/src/modules/v1/billing/plans`

This folder holds pricing plan records for the dashboard API.

## Contents

### Files

- `index.ts`
- `plan.controller.ts` — exports `PlanController`
- `plan.dto.ts` — exports `CreatePlanDto`, `UpdatePlanDto`, `GetPlanBySlugDto`, `ListPlansQueryDto` and 8 more
- `plan.ratelimiter.ts` — exports `planReadRateLimiter`, `planWriteRateLimiter`
- `plan.repo.ts` — exports `PlanRepository`, `planRepository`
- `plan.routes.ts`
- `plan.service.ts` — exports `PlanService`

## License

Copyright (c) 2026 Kyrazo LLC. All rights reserved. You may not use this folder for a commercial or a non-commercial purpose without written permission from Kyrazo LLC. See the [repository license](../../../../../../../../LICENSE).

The rules for changing this folder are in [CONTRIBUTING.md](CONTRIBUTING.md).
