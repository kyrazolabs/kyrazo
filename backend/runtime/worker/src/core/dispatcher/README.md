# Dispatcher

`backend/runtime/worker/src/core/dispatcher`

This folder holds the loop that takes a queued event and decides where it goes for the background worker.

## Contents

### Files

- `dispatcher.headers.test.ts`
- `dispatcher.headers.ts` — exports `DispatcherHeaders`, `dispatcherHeaders`
- `dispatcher.pipeline.test.ts`
- `dispatcher.pipeline.ts` — exports `DispatcherPipeline`, `dispatcherPipeline`
- `dispatcher.queue.test.ts`
- `dispatcher.queue.ts` — exports `JOB_PRIORITIES`, `DispatcherQueue`
- `dispatcher.signature.test.ts`
- `dispatcher.signature.ts` — exports `DispatcherSignature`, `dispatcherSignature`
- `dispatcher.transformer.test.ts`
- `dispatcher.transformer.ts` — exports `DispatcherTransformer`, `dispatcherTransformer`
- `dispatcher.types.ts` — exports `IWebhookHeaders`, `IDispatchedTarget`, `IDispatchedEvent`, `SignaturePayload` and 3 more
- `dispatcher.validator.test.ts`
- `dispatcher.validator.ts` — exports `DispatcherValidator`, `dispatcherValidator`

## License

Copyright (c) 2026 Kyrazo LLC. All rights reserved. You may not use this folder for a commercial or a non-commercial purpose without written permission from Kyrazo LLC. See the [repository license](../../../../../../LICENSE).

The rules for changing this folder are in [CONTRIBUTING.md](CONTRIBUTING.md).
