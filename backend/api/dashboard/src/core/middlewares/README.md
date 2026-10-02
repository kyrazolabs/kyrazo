# Middlewares

`backend/api/dashboard/src/core/middlewares`

This folder holds HTTP middleware that runs before the route handler for the dashboard API.

## Contents

### Files

- `arcjet.middleware.ts` — exports `arcjetMiddleware`
- `auth.middleware.ts` — exports `AppContext`, `authenticate`, `requireOwnership`
- `error.middleware.ts`
- `limits.middleware.ts` — exports `checkWorkspaceLimits`
- `namespace.middleware.ts` — exports `requireNamespaceAccess`, `requireNamespaceAccessParam`
- `otp.middleware.ts` — exports `SensitiveAction`, `requireRecentOTP`
- `ratelimit.middleware.ts` — exports `RateLimiterConfig`, `createSlidingWindowLimiter`, `createFixedWindowLimiter`, `createTokenBucketLimiter` and 2 more
- `security.middleware.ts`
- `sentry.middleware.ts` — exports `sentryMiddleware`
- `validator.middleware.ts` — exports `validate`
- `workspace.middleware.ts` — exports `requireWorkspaceMembership`, `requireWorkspaceMembershipParam`

## License

Copyright (c) 2026 Kyrazo LLC. All rights reserved. You may not use this folder for a commercial or a non-commercial purpose without written permission from Kyrazo LLC. See the [repository license](../../../../../../LICENSE).

The rules for changing this folder are in [CONTRIBUTING.md](CONTRIBUTING.md).
