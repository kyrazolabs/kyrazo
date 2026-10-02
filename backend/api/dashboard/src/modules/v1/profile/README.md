# Profile

`backend/api/dashboard/src/modules/v1/profile`

This folder holds the signed-in user's profile for the dashboard API.

## Contents

### Files

- `profile.controller.ts` — exports `ProfileController`
- `profile.ratelimiter.ts` — exports `profileReadRateLimiter`, `profileUpdateRateLimiter`, `preferencesReadRateLimiter`, `preferencesUpdateRateLimiter`
- `profile.repo.ts` — exports `ProfileRepository`, `profileRepository`
- `profile.routes.ts`
- `profile.schema.ts` — exports `UpdateProfileSchema`, `UpdatePreferencesSchema`, `UpdateProfileInput`, `UpdatePreferencesInput`

## License

Copyright (c) 2026 Kyrazo LLC. All rights reserved. You may not use this folder for a commercial or a non-commercial purpose without written permission from Kyrazo LLC. See the [repository license](../../../../../../../LICENSE).

The rules for changing this folder are in [CONTRIBUTING.md](CONTRIBUTING.md).
