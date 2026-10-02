# Stripe

`backend/runtime/worker/src/core/receiver/sources/stripe`

This folder holds the stripe code for the background worker.

## Contents

### Files

- `stripe.pipeline.test.ts`
- `stripe.pipeline.ts` — exports `StripePipeline`
- `stripe.signature.ts` — exports `StripeSignature`, `stripeSignature`
- `stripe.transformer.test.ts`
- `stripe.transformer.ts` — exports `StripeTransformer`, `stripeTransformer`
- `stripe.types.ts` — exports `StripeWebhookEvent`, `StripeEventType`
- `stripe.validator.ts` — exports `StripeValidator`, `stripeValidator`

## License

Copyright (c) 2026 Kyrazo LLC. All rights reserved. You may not use this folder for a commercial or a non-commercial purpose without written permission from Kyrazo LLC. See the [repository license](../../../../../../../../LICENSE).

The rules for changing this folder are in [CONTRIBUTING.md](CONTRIBUTING.md).
