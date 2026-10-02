# Mongodb

`backend/shared/src/models/mongodb`

This folder holds Mongoose models for users, workspaces, endpoints, and the rest of the transactional data for the shared backend library.

## Contents

### Folders

- [orchestrator](orchestrator/README.md) — the orchestrator code

### Files

- `2FA.model.ts` — exports `User2FA`
- `ASQS.model.ts` — exports `ASQS`
- `Customer.model.ts` — exports `Customer`
- `Endpoint.model.ts`
- `Invoice.model.ts` — exports `Invoice`
- `Key.model.ts` — exports `Key`
- `Namespace.model.ts`
- `Plan.model.ts`
- `RefreshToken.model.ts` — exports `RefreshToken`
- `S3Bucket.model.ts` — exports `S3Bucket`
- `Source.model.ts`
- `Subscription.model.ts`
- `Target.model.ts` — exports `Target`
- `Transform.model.ts` — exports `Transform`
- `TransformVersion.model.ts` — exports `TransformVersion`
- `Usage.model.ts` — exports `Usage`
- `User.model.ts`
- `UserPreference.model.ts` — exports `UserPreference`
- `UserSessions.model.ts` — exports `RefreshToken`
- `Workspace.model.ts`
- `WorkspaceInvitation.model.ts`
- `index.ts`
- `webhook_events_processed.model.ts` — exports `WebhookEventProcessed`

## License

Copyright (c) 2026 Kyrazo LLC. All rights reserved. You may not use this folder for a commercial or a non-commercial purpose without written permission from Kyrazo LLC. See the [repository license](../../../../../LICENSE).

The rules for changing this folder are in [CONTRIBUTING.md](CONTRIBUTING.md).
