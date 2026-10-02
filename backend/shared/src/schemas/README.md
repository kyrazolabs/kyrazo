# Schemas

`backend/shared/src/schemas`

This folder holds validation schemas for the shared backend library.

## Contents

### Files

- `common.zod.ts` — exports `NamespaceHeadersSchema`, `PopulatedIdSchema`, `NamespaceHeadersInput`, `PopulatedIdInput`
- `delivery.zod.ts` — exports `TargetQuerySchema`, `GetDeliveriesBySourceSchema`, `GetReceivedEventsBySourceSchema`, `GetDeliveriesSchema` and 11 more
- `event.zod.ts` — exports `PublishEventSchema`, `BatchPublishEventsSchema`, `ReceivedEventSchema`, `PublishedEventInput` and 3 more
- `index.ts`
- `mail.zod.ts` — exports `MailPayloadSchema`
- `paypal.zod.ts` — exports `PaypalProductSchema`, `PaypalProductPatchSchema`, `PaypalPlanFrequencySchema`, `PaypalPlanPricingSchemeSchema` and 15 more

## License

Copyright (c) 2026 Kyrazo LLC. All rights reserved. You may not use this folder for a commercial or a non-commercial purpose without written permission from Kyrazo LLC. See the [repository license](../../../../LICENSE).

The rules for changing this folder are in [CONTRIBUTING.md](CONTRIBUTING.md).
