import { Hono } from 'hono';
import { zValidator } from '@/core/middlewares/validator.middleware';
import { WorkspaceController } from '@/modules/v1/workspace/workspace.controller';
import { authenticate } from '@/core/middlewares/auth.middleware';
import { requireWorkspaceMembershipParam } from '@/core/middlewares/workspace.middleware';
import { checkWorkspaceLimits } from '@/core/middlewares/limits.middleware';
import { requireRecentOTP } from '@/core/middlewares/otp.middleware';
import { workspaceReadRateLimiter, workspaceWriteRateLimiter } from './workspace.ratelimiter';
import {
    CreateWorkspaceSchema,
    GetWorkspaceByIdSchema,
    InviteWorkspaceMemberSchema,
    UpdateInvitationStatusSchema,
    UpdateWorkspaceMemberRoleSchema,
    UpdateWorkspaceSchema,
    WorkspaceMemberSchema,
} from './workspace.schema';

const workspace = new Hono();

// All other workspace routes require authentication
workspace.use(authenticate);

// Create workspace (requires organization membership)
workspace.post(
    '/',
    workspaceWriteRateLimiter,
    zValidator('json', CreateWorkspaceSchema),
    WorkspaceController.createWorkspace
);

workspace.get('/', workspaceReadRateLimiter, WorkspaceController.getUserWorkspaces);

// This route does not require authentication
workspace.get(
    '/invitations/details/:token',
    zValidator('param', UpdateInvitationStatusSchema),
    WorkspaceController.getInvitationDetails
);
workspace.post(
    '/invitations/:token/accept',
    workspaceWriteRateLimiter,
    zValidator('param', UpdateInvitationStatusSchema),
    WorkspaceController.acceptWorkspaceInvitation
);

workspace.post(
    '/invitations/:token/reject',
    workspaceWriteRateLimiter,
    zValidator('param', UpdateInvitationStatusSchema),
    WorkspaceController.rejectWorkspaceInvitation
);

// Routes requiring workspace membership
workspace.use('/', requireWorkspaceMembershipParam());

workspace.post(
    '/:workspaceId/leave',
    workspaceWriteRateLimiter,
    zValidator('param', GetWorkspaceByIdSchema),
    WorkspaceController.leaveWorkspace
);

workspace.get(
    '/:workspaceId',
    workspaceReadRateLimiter,
    zValidator('param', GetWorkspaceByIdSchema),
    WorkspaceController.getWorkspaceById
);

workspace.patch(
    '/:workspaceId',
    workspaceWriteRateLimiter,
    zValidator('param', GetWorkspaceByIdSchema),
    zValidator('json', UpdateWorkspaceSchema),
    requireWorkspaceMembershipParam(['admin', 'owner']),
    requireRecentOTP('update_workspace'),
    WorkspaceController.updateWorkspace
);

workspace.delete(
    '/:workspaceId',
    workspaceWriteRateLimiter,
    zValidator('param', GetWorkspaceByIdSchema),
    requireWorkspaceMembershipParam(['owner']),
    requireRecentOTP('delete_workspace'),
    WorkspaceController.deleteWorkspace
);

workspace.post(
    '/:workspaceId/restore',
    workspaceWriteRateLimiter,
    zValidator('param', GetWorkspaceByIdSchema),
    requireWorkspaceMembershipParam(['owner']),
    WorkspaceController.restoreWorkspace
);

workspace.post(
    '/:workspaceId/archive',
    workspaceWriteRateLimiter,
    zValidator('param', GetWorkspaceByIdSchema),
    requireWorkspaceMembershipParam(['admin', 'owner']),
    WorkspaceController.archiveWorkspace
);

workspace.post(
    '/:workspaceId/unarchive',
    workspaceWriteRateLimiter,
    zValidator('param', GetWorkspaceByIdSchema),
    requireWorkspaceMembershipParam(['admin', 'owner']),
    WorkspaceController.unarchiveWorkspace
);

// Workspace members management
workspace.get(
    '/:workspaceId/members',
    workspaceReadRateLimiter,
    zValidator('param', GetWorkspaceByIdSchema),
    WorkspaceController.getWorkspaceMembers
);

workspace.post(
    '/:workspaceId/invitations',
    workspaceWriteRateLimiter,
    zValidator('param', GetWorkspaceByIdSchema),
    requireWorkspaceMembershipParam(['admin', 'owner']),
    checkWorkspaceLimits('maxMembers'),
    zValidator('json', InviteWorkspaceMemberSchema),
    WorkspaceController.inviteUserToWorkspace
);

workspace.delete(
    '/:workspaceId/members/:userId',
    workspaceWriteRateLimiter,
    zValidator('param', GetWorkspaceByIdSchema),
    requireWorkspaceMembershipParam(['admin', 'owner']),
    zValidator('param', WorkspaceMemberSchema),
    WorkspaceController.removeUserFromWorkspace
);

workspace.patch(
    '/:workspaceId/members/role',
    workspaceWriteRateLimiter,
    zValidator('param', GetWorkspaceByIdSchema),
    requireWorkspaceMembershipParam(['admin', 'owner']),
    zValidator('json', UpdateWorkspaceMemberRoleSchema),
    WorkspaceController.updateUserRoleInWorkspace
);

export default workspace;
