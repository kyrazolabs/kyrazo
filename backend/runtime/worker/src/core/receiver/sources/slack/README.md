# Slack

`backend/runtime/worker/src/core/receiver/sources/slack`

This folder holds the slack code for the background worker.

## Contents

### Files

- `slack.pipeline.test.ts`
- `slack.pipeline.ts` — exports `SlackPipeline`
- `slack.signature.ts` — exports `SlackSignature`, `slackSignature`
- `slack.transformer.test.ts`
- `slack.transformer.ts` — exports `SlackTransformer`, `slackTransformer`
- `slack.types.ts` — exports `SlackEventPayload`, `ISlackHeaders`
- `slack.validator.ts` — exports `SlackValidator`, `slackValidator`

## License

Copyright (c) 2026 Kyrazo LLC. All rights reserved. You may not use this folder for a commercial or a non-commercial purpose without written permission from Kyrazo LLC. See the [repository license](../../../../../../../../LICENSE).

The rules for changing this folder are in [CONTRIBUTING.md](CONTRIBUTING.md).
