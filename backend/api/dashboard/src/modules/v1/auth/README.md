# Auth

`backend/api/dashboard/src/modules/v1/auth`

This folder holds sign-in, registration, and session handling for the dashboard API.

## Contents

### Files

- `auth.controller.ts` — exports `AuthController`
- `auth.ratelimiter.ts` — exports `registerRateLimiter`, `loginRateLimiter`, `refreshTokenRateLimiter`, `forgotPasswordRateLimiter` and 3 more
- `auth.repo.ts` — exports `AuthRepository`, `authRepository`
- `auth.routes.ts`
- `auth.schema.ts` — exports `RegisterSchema`, `LoginSchema`, `GoogleLoginSchema`, `RefreshTokenSchema` and 24 more

## License

Copyright (c) 2026 Kyrazo LLC. All rights reserved. You may not use this folder for a commercial or a non-commercial purpose without written permission from Kyrazo LLC. See the [repository license](../../../../../../../LICENSE).

The rules for changing this folder are in [CONTRIBUTING.md](CONTRIBUTING.md).
