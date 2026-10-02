# Receiver

`backend/runtime/worker/src/core/receiver`

This folder holds the receiver code for the background worker.

## Contents

### Folders

- [sources](sources/README.md) — event sources that accept inbound webhooks

### Files

- `receiver.detector.test.ts`
- `receiver.detector.ts` — exports `ReceiverDetector`
- `receiver.pipeline.test.ts`
- `receiver.pipeline.ts` — exports `ReceiverPipeline`, `receiverPipeline`
- `receiver.transformer.test.ts`
- `receiver.transformer.ts` — exports `ReceiverTransformer`, `receiverTransformer`

## License

Copyright (c) 2026 Kyrazo LLC. All rights reserved. You may not use this folder for a commercial or a non-commercial purpose without written permission from Kyrazo LLC. See the [repository license](../../../../../../LICENSE).

The rules for changing this folder are in [CONTRIBUTING.md](CONTRIBUTING.md).
