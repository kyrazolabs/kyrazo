# Paypal

`backend/runtime/worker/src/core/receiver/sources/paypal`

This folder holds the paypal code for the background worker.

## Contents

### Files

- `paypal.pipeline.test.ts`
- `paypal.pipeline.ts` — exports `PayPalPipeline`
- `paypal.signature.ts` — exports `PayPalSignature`, `paypalSignature`
- `paypal.transformer.test.ts`
- `paypal.transformer.ts` — exports `PayPalTransformer`, `paypalTransformer`
- `paypal.types.ts` — exports `PayPalWebhookEvent`, `PayPalLink`, `PayPalEventType`
- `paypal.validator.ts` — exports `PayPalValidator`, `paypalValidator`

## License

Copyright (c) 2026 Kyrazo LLC. All rights reserved. You may not use this folder for a commercial or a non-commercial purpose without written permission from Kyrazo LLC. See the [repository license](../../../../../../../../LICENSE).

The rules for changing this folder are in [CONTRIBUTING.md](CONTRIBUTING.md).
