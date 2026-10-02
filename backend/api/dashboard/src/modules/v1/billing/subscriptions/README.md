# Subscriptions

`backend/api/dashboard/src/modules/v1/billing/subscriptions`

This folder holds subscription records for the dashboard API.

## Contents

### Files

- `index.ts`
- `subscription.controller.ts` — exports `SubscriptionController`
- `subscription.dto.ts` — exports `CreateSubscriptionDto`, `ChangePlanDto`, `CancelSubscriptionDto`, `GetSubscriptionByIdDto` and 10 more
- `subscription.ratelimiter.ts` — exports `subscriptionReadRateLimiter`, `subscriptionWriteRateLimiter`
- `subscription.repo.ts` — exports `SubscriptionRepository`
- `subscription.routes.ts`
- `subscription.service.ts` — exports `SubscriptionService`

## License

Copyright (c) 2026 Kyrazo LLC. All rights reserved. You may not use this folder for a commercial or a non-commercial purpose without written permission from Kyrazo LLC. See the [repository license](../../../../../../../../LICENSE).

The rules for changing this folder are in [CONTRIBUTING.md](CONTRIBUTING.md).
