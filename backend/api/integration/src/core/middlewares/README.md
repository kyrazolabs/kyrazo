# Middlewares

`backend/api/integration/src/core/middlewares`

This folder holds HTTP middleware that runs before the route handler for the integration API.

## Contents

### Files

- `auth.middleware.ts` — exports `AppContext`, `authenticate`
- `error.middleware.ts`
- `idem.middleware.ts` — exports `idempotencyMiddleware`
- `rate-limiter.middleware.ts` — exports `RateLimiterConfig`, `createSlidingWindowLimiter`, `createFixedWindowLimiter`, `createTokenBucketLimiter` and 2 more
- `security.middleware.ts` — exports `RateLimiterConfig`, `createTokenBucketLimiter`, `createRateLimitMiddleware`, `createDynamicRateLimiter`
- `validator.middleware.ts` — exports `validator`

## License

Copyright (c) 2026 Kyrazo LLC. All rights reserved. You may not use this folder for a commercial or a non-commercial purpose without written permission from Kyrazo LLC. See the [repository license](../../../../../../LICENSE).

The rules for changing this folder are in [CONTRIBUTING.md](CONTRIBUTING.md).
