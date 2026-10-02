# Middlewares

`backend/api/ingest/src/core/middlewares`

This folder holds HTTP middleware that runs before the route handler for the ingest API.

## Contents

### Files

- `error.middleware.ts`
- `rate-limiter.middleware.ts` — exports `RateLimiterConfig`, `createSlidingWindowLimiter`, `createFixedWindowLimiter`, `createTokenBucketLimiter` and 2 more
- `security.middleware.ts`
- `validator.middleware.ts` — exports `validator`

## License

Copyright (c) 2026 Kyrazo LLC. All rights reserved. You may not use this folder for a commercial or a non-commercial purpose without written permission from Kyrazo LLC. See the [repository license](../../../../../../LICENSE).

The rules for changing this folder are in [CONTRIBUTING.md](CONTRIBUTING.md).
