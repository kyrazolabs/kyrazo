# Payments

`backend/api/dashboard/src/modules/v1/billing/payments`

This folder holds checkout and payment records for the dashboard API.

## Contents

### Files

- `index.ts`
- `payment.controller.ts` — exports `PaymentController`
- `payment.dto.ts` — exports `PaymentResponseDto`, `StripeSourceDto`, `CreateBillingPortalDto`, `BillingPortalResponseDto` and 4 more
- `payment.ratelimiter.ts` — exports `paymentReadRateLimiter`, `paymentWriteRateLimiter`
- `payment.repo.ts` — exports `PaymentRepository`, `paymentRepository`
- `payment.routes.ts`
- `payment.service.ts` — exports `PaymentService`

## License

Copyright (c) 2026 Kyrazo LLC. All rights reserved. You may not use this folder for a commercial or a non-commercial purpose without written permission from Kyrazo LLC. See the [repository license](../../../../../../../../LICENSE).

The rules for changing this folder are in [CONTRIBUTING.md](CONTRIBUTING.md).
