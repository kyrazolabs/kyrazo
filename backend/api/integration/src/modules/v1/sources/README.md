# Sources

`backend/api/integration/src/modules/v1/sources`

This folder holds event sources that accept inbound webhooks for the integration API.

## Contents

### Files

- `source.controller.ts` — exports `SourceController`
- `source.repo.ts` — exports `SourceRepository`, `sourceRepository`
- `source.routes.ts`
- `source.schema.ts` — exports `sourceStatus`, `sourceService`, `sourceAuthType`, `sourceAuthHmacAlgorithm` and 3 more
- `source.service.ts` — exports `SourceService`
- `source.test.ts`
- `source.types.ts` — exports `CreateSourceResponse`, `GetSourcesResponse`, `GetSourceResponse`, `UpdateSourceResponse` and 1 more

## License

Copyright (c) 2026 Kyrazo LLC. All rights reserved. You may not use this folder for a commercial or a non-commercial purpose without written permission from Kyrazo LLC. See the [repository license](../../../../../../../LICENSE).

The rules for changing this folder are in [CONTRIBUTING.md](CONTRIBUTING.md).
