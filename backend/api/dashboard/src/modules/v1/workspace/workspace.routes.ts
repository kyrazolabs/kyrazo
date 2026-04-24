import { Hono } from 'hono';
import { validate } from '@/core/middlewares/validator.middleware';
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
    validate('json', CreateWorkspaceSchema),
    WorkspaceController.createWorkspace
);

workspace.get('/', workspaceReadRateLimiter, WorkspaceController.getUserWorkspaces);

// This route does not require authentication
workspace.get(
    '/invitations/details/:token',
    validate('param', UpdateInvitationStatusSchema),
    WorkspaceController.getInvitationDetails
);
workspace.post(
    '/invitations/:token/accept',
    workspaceWriteRateLimiter,
    validate('param', UpdateInvitationStatusSchema),
    WorkspaceController.acceptWorkspaceInvitation
);

workspace.post(
    '/invitations/:token/reject',
    workspaceWriteRateLimiter,
    validate('param', UpdateInvitationStatusSchema),
    WorkspaceController.rejectWorkspaceInvitation
);

// Routes requiring workspace membership
workspace.use('/', requireWorkspaceMembershipParam());

workspace.post(
    '/:workspaceId/leave',
    workspaceWriteRateLimiter,
    validate('param', GetWorkspaceByIdSchema),
    WorkspaceController.leaveWorkspace
);

workspace.get(
    '/:workspaceId',
    workspaceReadRateLimiter,
    validate('param', GetWorkspaceByIdSchema),
    WorkspaceController.getWorkspaceById
);

workspace.patch(
    '/:workspaceId',
    workspaceWriteRateLimiter,
    validate('param', GetWorkspaceByIdSchema),
    validate('json', UpdateWorkspaceSchema),
    requireWorkspaceMembershipParam(['admin', 'owner']),
    requireRecentOTP('update_workspace'),
    WorkspaceController.updateWorkspace
);

workspace.delete(
    '/:workspaceId',
    workspaceWriteRateLimiter,
    validate('param', GetWorkspaceByIdSchema),
    requireWorkspaceMembershipParam(['owner']),
    requireRecentOTP('delete_workspace'),
    WorkspaceController.deleteWorkspace
);

workspace.post(
    '/:workspaceId/restore',
    workspaceWriteRateLimiter,
    validate('param', GetWorkspaceByIdSchema),
    requireWorkspaceMembershipParam(['owner']),
    WorkspaceController.restoreWorkspace
);

workspace.post(
    '/:workspaceId/archive',
    workspaceWriteRateLimiter,
    validate('param', GetWorkspaceByIdSchema),
    requireWorkspaceMembershipParam(['admin', 'owner']),
    WorkspaceController.archiveWorkspace
);

workspace.post(
    '/:workspaceId/unarchive',
    workspaceWriteRateLimiter,
    validate('param', GetWorkspaceByIdSchema),
    requireWorkspaceMembershipParam(['admin', 'owner']),
    WorkspaceController.unarchiveWorkspace
);

// Workspace members management
workspace.get(
    '/:workspaceId/members',
    workspaceReadRateLimiter,
    validate('param', GetWorkspaceByIdSchema),
    WorkspaceController.getWorkspaceMembers
);

workspace.post(
    '/:workspaceId/invitations',
    workspaceWriteRateLimiter,
    validate('param', GetWorkspaceByIdSchema),
    requireWorkspaceMembershipParam(['admin', 'owner']),
    checkWorkspaceLimits('maxMembers'),
    validate('json', InviteWorkspaceMemberSchema),
    WorkspaceController.inviteUserToWorkspace
);

workspace.delete(
    '/:workspaceId/members/:userId',
    workspaceWriteRateLimiter,
    validate('param', GetWorkspaceByIdSchema),
    requireWorkspaceMembershipParam(['admin', 'owner']),
    validate('param', WorkspaceMemberSchema),
    WorkspaceController.removeUserFromWorkspace
);

workspace.patch(
    '/:workspaceId/members/role',
    workspaceWriteRateLimiter,
    validate('param', GetWorkspaceByIdSchema),
    requireWorkspaceMembershipParam(['admin', 'owner']),
    validate('json', UpdateWorkspaceMemberRoleSchema),
    WorkspaceController.updateUserRoleInWorkspace
);

export default workspace;
