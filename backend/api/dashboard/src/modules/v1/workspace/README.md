# Workspace

`backend/api/dashboard/src/modules/v1/workspace`

This folder holds workspaces, the tenant boundary for the dashboard API.

## Contents

### Files

- `workspace.controller.ts` — exports `WorkspaceController`
- `workspace.ratelimiter.ts` — exports `workspaceReadRateLimiter`, `workspaceWriteRateLimiter`
- `workspace.repo.ts` — exports `WorkspaceRepository`
- `workspace.routes.ts`
- `workspace.schema.ts` — exports `CreateWorkspaceSchema`, `UpdateWorkspaceSchema`, `InviteWorkspaceMemberSchema`, `GetWorkspaceByIdSchema` and 11 more
- `workspace.service.ts` — exports `WorkspaceService`
- `workspace.types.ts` — exports `CreateWorkspaceResponse`, `GetWorkspacesResponse`, `GetWorkspaceResponse`, `UpdateWorkspaceResponse` and 2 more

## License

Copyright (c) 2026 Kyrazo LLC. All rights reserved. You may not use this folder for a commercial or a non-commercial purpose without written permission from Kyrazo LLC. See the [repository license](../../../../../../../LICENSE).

The rules for changing this folder are in [CONTRIBUTING.md](CONTRIBUTING.md).
