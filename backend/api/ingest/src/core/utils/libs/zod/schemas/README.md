# Schemas

`backend/api/ingest/src/core/utils/libs/zod/schemas`

This folder holds validation schemas for the ingest API.

## Contents

### Files

- `api.zod.ts` — exports `createAPIKeySchema`, `getKeysSchema`, `checkScopeSchema`, `revokeKeyById` and 4 more
- `common.zod.ts` — exports `NamespaceHeadersSchema`, `GetNamespaceByIdSchema`, `NamespaceHeadersInput`
- `endpoint.zod.ts` — exports `endpointStatusEnum`, `CreateEndpointSchema`, `UpdateEndpointSchema`, `UpdateEndpointStatusSchema` and 7 more
- `event.zod.ts` — exports `PublishEventSchema`, `BatchPublishEventsSchema`, `ReceivedEventSchema`, `PublishedEventInput` and 3 more
- `source.zod.ts` — exports `sourceStatus`, `sourceType`, `sourceService`, `sourceAuthType` and 4 more

## License

Copyright (c) 2026 Kyrazo LLC. All rights reserved. You may not use this folder for a commercial or a non-commercial purpose without written permission from Kyrazo LLC. See the [repository license](../../../../../../../../../LICENSE).

The rules for changing this folder are in [CONTRIBUTING.md](CONTRIBUTING.md).
