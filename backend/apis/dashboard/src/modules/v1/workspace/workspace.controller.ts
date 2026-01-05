import { AppContext } from '@/core/middlewares/auth.middleware';
import { logger } from '@/configs';
import {
    CreateWorkspaceInput,
    GetWorkspaceByIdInput,
    InviteWorkspaceMemberInput,
    UpdateInvitationStatusInput,
    UpdateWorkspaceInput,
    UpdateWorkspaceMemberRoleInput,
    WorkspaceMemberInput,
} from './workspace.schema';
import { IErrorResponse } from '@kyrazo/shared';
import { workspaceService } from './workspace.service';
import {
    CreateWorkspaceResponse,
    GetWorkspacesResponse,
    GetWorkspaceMembersResponse,
    GetWorkspaceResponse,
    UpdateWorkspaceResponse,
    WorkspaceActionResponse,
} from './workspace.types';

export class WorkspaceController {
    /**
     * @title Create Workspace
     * @description Creates a new workspace for the authenticated user.
     */
    static async createWorkspace(c: AppContext): Promise<Response> {
        try {
            const userId = c.user?.userId;
            if (!userId) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'UNAUTORIZED_USER',
                            message: 'Unauthorized user',
                            requestId: c.get('requestId'),
                        },
                    },
                    401
                );
            }

            const valid: CreateWorkspaceInput = c.req.valid('json');
            const workspace = await workspaceService.createWorkspace(
                userId,
                valid
            );

            return c.json<CreateWorkspaceResponse>(
                {
                    success: true,
                    message: 'Workspace created successfully',
                    data: workspace,
                },
                201
            );
        } catch (error: any) {
            logger.error('Create workspace controller error:', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'FAILED_CREATE_WORKSPACE',
                        message: error.message || 'Failed to create workspace',
                        details: error,
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    /**
     * @title Get Workspace by ID
     * @description Retrieves a workspace by its unique identifier.
     */
    static async getWorkspaceById(c: AppContext): Promise<Response> {
        try {
            const { workspaceId }: GetWorkspaceByIdInput = c.req.valid('param');
            const workspace =
                await workspaceService.getWorkspaceById(workspaceId);

            if (!workspace) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'WORKSPACE_NOT_FOUND',
                            message: 'Workspace not found',
                            requestId: c.get('requestId'),
                        },
                    },
                    404
                );
            }

            return c.json<GetWorkspaceResponse>(
                {
                    success: true,
                    message: 'Workspace retrieved successfully',
                    data: workspace,
                },
                200
            );
        } catch (error: any) {
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'GET_WORKSPACE_FAILED',
                        message: error.message || 'Failed to get workspace',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    /**
     * @title Get User Workspaces
     * @description Retrieves all workspaces the user belongs to.
     */
    static async getUserWorkspaces(c: AppContext): Promise<Response> {
        try {
            const userId = c.user?.userId;
            if (!userId) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'UNAUTHORIZED_USER',
                            message: 'Unauthorized user',
                            requestId: c.get('requestId'),
                        },
                    },
                    401
                );
            }

            const workspaces = await workspaceService.getUserWorkspaces(userId);

            return c.json<GetWorkspacesResponse>(
                {
                    success: true,
                    message: 'User workspaces retrieved successfully',
                    data: workspaces,
                },
                200
            );
        } catch (error: any) {
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'GET_USER_WORKSPACES_FAILED',
                        message:
                            error.message || 'Failed to get user workspaces',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    /**
     * @title Update Workspace
     * @description Updates an existing workspace.
     */
    static async updateWorkspace(c: AppContext): Promise<Response> {
        try {
            const { workspaceId }: GetWorkspaceByIdInput = c.req.valid('param');
            const valid: UpdateWorkspaceInput = c.req.valid('json');

            const workspace = await workspaceService.updateWorkspace(
                workspaceId,
                valid
            );
            if (!workspace) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'WORKSPACE_NOT_FOUND',
                            message: 'Workspace not found',
                            requestId: c.get('requestId'),
                        },
                    },
                    404
                );
            }

            return c.json<UpdateWorkspaceResponse>(
                {
                    success: true,
                    message: 'Workspace updated successfully',
                    data: workspace,
                },
                201
            );
        } catch (error: any) {
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'UPDATE_WORKSPACE_FAILED',
                        message: error.message || 'Failed to update workspace',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    /**
     * @title Delete Workspace (Soft Delete)
     * @description Soft deletes a workspace.
     */
    static async deleteWorkspace(c: AppContext): Promise<Response> {
        try {
            const workspaceId = c.workspace?.workspaceId;
            if (!workspaceId) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'UNAUTORIZED_USER',
                            message: 'Unauthorized user',
                            requestId: c.get('requestId'),
                        },
                    },
                    401
                );
            }

            const workspace = await workspaceService.deleteWorkspace(
                workspaceId.toString()
            );
            if (!workspace) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'WORKSPACE_NOT_FOUND',
                            message: 'Workspace not found',
                            requestId: c.get('requestId'),
                        },
                    },
                    404
                );
            }

            return c.json<WorkspaceActionResponse>(
                {
                    success: true,
                    message: 'Workspace soft-deleted successfully',
                },
                200
            );
        } catch (error: any) {
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'DELETE_WORKSPACE_FAILED',
                        message: error.message || 'Failed to delete workspace',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    /**
     * @title Restore Workspace
     * @description Restores a soft-deleted workspace.
     */
    static async restoreWorkspace(c: AppContext): Promise<Response> {
        try {
            const { workspaceId }: GetWorkspaceByIdInput = c.req.valid('param');
            const workspace =
                await workspaceService.restoreWorkspace(workspaceId);

            if (!workspace) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'WORKSPACE_NOT_FOUND',
                            message: 'Workspace not found',
                            requestId: c.get('requestId'),
                        },
                    },
                    404
                );
            }

            return c.json<WorkspaceActionResponse>(
                {
                    success: true,
                    message: 'Workspace restored successfully',
                },
                200
            );
        } catch (error: any) {
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'RESTORE_WORKSPACE_FAILED',
                        message: error.message || 'Failed to restore workspace',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    /**
     * @title Archive Workspace
     * @description Archives a workspace.
     */
    static async archiveWorkspace(c: AppContext): Promise<Response> {
        try {
            const { workspaceId }: GetWorkspaceByIdInput = c.req.valid('param');
            const success =
                await workspaceService.archiveWorkspace(workspaceId);

            if (!success) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'WORKSPACE_NOT_FOUND',
                            message: 'Workspace not found',
                            requestId: c.get('requestId'),
                        },
                    },
                    404
                );
            }

            return c.json<WorkspaceActionResponse>(
                {
                    success: true,
                    message: 'Workspace archived successfully',
                },
                200
            );
        } catch (error: any) {
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'ARCHIVE_WORKSPACE_FAILED',
                        message: error.message || 'Failed to archive workspace',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    /**
     * @title Unarchive Workspace
     * @description Unarchives a previously archived workspace.
     */
    static async unarchiveWorkspace(c: AppContext): Promise<Response> {
        try {
            const { workspaceId }: GetWorkspaceByIdInput = c.req.valid('param');
            const success =
                await workspaceService.unarchiveWorkspace(workspaceId);

            if (!success) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'WORKSPACE_NOT_FOUND',
                            message: 'Workspace not found',
                            requestId: c.get('requestId'),
                        },
                    },
                    404
                );
            }

            return c.json<WorkspaceActionResponse>(
                {
                    success: true,
                    message: 'Workspace unarchived successfully',
                },
                200
            );
        } catch (error: any) {
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'UNARCHIVE_WORKSPACE_FAILED',
                        message:
                            error.message || 'Failed to unarchive workspace',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    /**
     * @title Invite User to Workspace
     * @description Sends an invitation to a user to join a workspace.
     */
    static async inviteUserToWorkspace(c: AppContext): Promise<Response> {
        try {
            const inviterId = c.user?.userId;
            if (!inviterId) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'UNAUTHORIZED_USER',
                            message: 'Unauthorized user',
                            requestId: c.get('requestId'),
                        },
                    },
                    401
                );
            }

            const { workspaceId }: GetWorkspaceByIdInput = c.req.valid('param');
            const { email, role, message }: InviteWorkspaceMemberInput =
                c.req.valid('json');

            await workspaceService.inviteUser(
                inviterId,
                workspaceId,
                email,
                role,
                message
            );

            return c.json<WorkspaceActionResponse>(
                {
                    success: true,
                    message: 'Invitation has been sent successfully',
                },
                201
            );
        } catch (error: any) {
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'INVITE_USER_FAILED',
                        message:
                            error.message || 'Failed to add user to workspace',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    /**
     * @title Accept Workspace Invitation
     * @description Accepts a user workspace invitation.
     */
    static async acceptWorkspaceInvitation(c: AppContext): Promise<Response> {
        try {
            const userId = c.user?.userId;
            const userEmail = c.user?.email;
            if (!userId || !userEmail) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'UNAUTHORIZED_USER',
                            message: 'Unauthorized user',
                            requestId: c.get('requestId'),
                        },
                    },
                    401
                );
            }

            const { token }: UpdateInvitationStatusInput = c.req.valid('param');
            await workspaceService.acceptInvitation(userId, userEmail, token);

            return c.json<WorkspaceActionResponse>(
                {
                    success: true,
                    message: 'Invitation accepted successfully',
                },
                200
            );
        } catch (error: any) {
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'ACCEPT_INVITATION_FAILED',
                        message: error.message || 'Failed to accept invitation',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    /**
     * @title Reject Workspace Invitation
     * @description Rejects a user workspace invitation.
     */
    static async rejectWorkspaceInvitation(c: AppContext): Promise<Response> {
        try {
            const userId = c.user?.userId;
            const userEmail = c.user?.email;
            if (!userId || !userEmail) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'UNAUTHORIZED_USER',
                            message: 'Unauthorized user',
                            requestId: c.get('requestId'),
                        },
                    },
                    401
                );
            }

            const { token }: UpdateInvitationStatusInput = c.req.valid('param');
            await workspaceService.rejectInvitation(userId, userEmail, token);

            return c.json<WorkspaceActionResponse>(
                {
                    success: true,
                    message: 'Invitation rejected successfully',
                },
                200
            );
        } catch (error: any) {
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'REJECT_INVITATION_FAILED',
                        message: error.message || 'Failed to reject invitation',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    /**
     * @title Remove User from Workspace
     * @description Removes a user from a workspace.
     */
    static async removeUserFromWorkspace(c: AppContext): Promise<Response> {
        try {
            const { workspaceId, userId }: WorkspaceMemberInput =
                c.req.valid('param');

            const success = await workspaceService.removeMember(
                workspaceId,
                userId
            );
            if (!success) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'USER_NOT_IN_WORKSPACE',
                            message: 'User is not a member of this workspace',
                            requestId: c.get('requestId'),
                        },
                    },
                    404
                );
            }

            return c.json<WorkspaceActionResponse>(
                {
                    success: true,
                    message: 'User removed from workspace successfully',
                },
                200
            );
        } catch (error: any) {
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'REMOVE_USER_FAILED',
                        message:
                            error.message ||
                            'Failed to remove user from workspace',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    /**
     * @title Update User Role in Workspace
     * @description Updates the role of a user in a workspace.
     */
    static async updateUserRoleInWorkspace(c: AppContext): Promise<Response> {
        try {
            const { workspaceId }: GetWorkspaceByIdInput = c.req.valid('param');
            const { userId, role }: UpdateWorkspaceMemberRoleInput =
                c.req.valid('json');

            const membership = await workspaceService.updateMemberRole(
                workspaceId,
                userId,
                role
            );
            if (!membership) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'USER_NOT_IN_WORKSPACE',
                            message: 'User is not a member of this workspace',
                            requestId: c.get('requestId'),
                        },
                    },
                    404
                );
            }

            return c.json<WorkspaceActionResponse>(
                {
                    success: true,
                    message: 'User role updated in workspace successfully',
                },
                200
            );
        } catch (error: any) {
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'UPDATE_USER_ROLE_FAILED',
                        message: error.message || 'Failed to update user role',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    /**
     * @title Get Workspace Members
     * @description Retrieves all members of a workspace.
     */
    static async getWorkspaceMembers(c: AppContext): Promise<Response> {
        try {
            const { workspaceId }: GetWorkspaceByIdInput = c.req.valid('param');
            const members =
                await workspaceService.getWorkspaceMembers(workspaceId);

            return c.json<GetWorkspaceMembersResponse>(
                {
                    success: true,
                    message: 'Workspace members retrieved successfully',
                    data: members,
                },
                200
            );
        } catch (error: any) {
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'GET_WORKSPACE_MEMBER_FAILED',
                        message:
                            error.message ||
                            'Failed to retrieve workspace members',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }
    /**
     * @title Get Invitation Details
     * @description Retrieves invitation details by token.
     */
    static async getInvitationDetails(c: AppContext): Promise<Response> {
        try {
            const { token }: UpdateInvitationStatusInput = c.req.valid('param');
            const details = await workspaceService.getInvitationByToken(token);

            return c.json<any>(
                {
                    success: true,
                    message: 'Invitation details retrieved successfully',
                    data: details,
                },
                200
            );
        } catch (error: any) {
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'GET_INVITATION_DETAILS_FAILED',
                        message:
                            error.message || 'Failed to get invitation details',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }
}

export default WorkspaceController;
