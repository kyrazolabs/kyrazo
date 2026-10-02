# Namespace

`backend/api/dashboard/src/modules/v2/namespace`

This folder holds namespaces, the routing boundary a customer's events belong to for the dashboard API.

## Contents

### Files

- `namespace.controller.ts` — exports `NamespaceControllerV2`
- `namespace.ratelimiter.ts` — exports `namespaceReadRateLimiter`, `namespaceWriteRateLimiter`
- `namespace.repo.ts` — exports `NamespaceRepositoryV2`, `namespaceRepositoryV2`
- `namespace.routes.ts`
- `namespace.schema.ts` — exports `CreateNamespaceSchema`, `UpdateNamespaceSchema`, `NamespaceIdParamSchema`, `SearchNamespaceSchema`
- `namespace.service.ts` — exports `NamespaceServiceV2`
- `namespace.types.ts` — exports `CreateNamespaceDto`, `UpdateNamespaceDto`, `SearchNamespaceDto`, `NamespaceIdParamDto` and 5 more

## License

Copyright (c) 2026 Kyrazo LLC. All rights reserved. You may not use this folder for a commercial or a non-commercial purpose without written permission from Kyrazo LLC. See the [repository license](../../../../../../../LICENSE).

The rules for changing this folder are in [CONTRIBUTING.md](CONTRIBUTING.md).
