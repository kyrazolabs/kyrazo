import { Next } from 'hono';
import { AppContext } from './auth.middleware';
import { redisConfig } from '@/configs';
import { GetWorkspaceByIdInput } from '@/modules/v1/workspace/workspace.schema';
import { IErrorResponse, logger, UserWorkspace, unprefixId } from '@kyrazo/shared';

/**
 * @title requireWorkspaceMembership Middleware
 * @description Middleware to require workspace membership and (optionally) a specific role. Attaches workspace membership to request.
 */
export const requireWorkspaceMembership = (requiredRole?: string[]) => {
    return async (c: AppContext, next: Next) => {
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

            const workspaceId = c.req.header('x-workspace-id');
            if (!workspaceId) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'WORKSPACE_ID_MISSING',
                            message: 'Workspace ID is required',
                            requestId: c.get('requestId'),
                        },
                    },
                    400
                );
            }

            const membership = await redisConfig.cache(
                `workspace:${unprefixId(workspaceId)}:user:${unprefixId(userId)}`,
                async () => {
                    return await UserWorkspace.findByUserAndWorkspace(userId, workspaceId);
                },
                60 * 15
            );

            if (!membership) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'WORKSPACE_ACCESS_DENIED',
                            message: 'Access denied: Not a member of this workspace',
                            requestId: c.get('requestId'),
                        },
                    },
                    403
                );
            }

            // Check role if specified
            if (requiredRole && !requiredRole.includes(membership.role)) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'INSUFFICIENT_WORKSPACE_ROLE',
                            message: `Access denied: Requires ${requiredRole.join(' or ')} role`,
                            requestId: c.get('requestId'),
                        },
                    },
                    403
                );
            }

            c.workspace = membership;
            await next();
        } catch (error: any) {
            logger.error('Unexpected error in requireWorkspaceMembership middleware', error);

            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'INTERNAL_ERROR',
                        message: 'Internal server error',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    };
};

/**
 * @title requireWorkspaceMembershipParam Middleware
 * @description Middleware to require workspace membership by params and (optionally) a specific role. Attaches workspace membership to request.
 */
export const requireWorkspaceMembershipParam = (requiredRole?: string[]) => {
    return async (c: AppContext, next: Next) => {
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

            // @ts-ignore
            const { workspaceId }: GetWorkspaceByIdInput = c.req.valid('param');
            if (!workspaceId) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'WORKSPACE_ID_MISSING',
                            message: 'Workspace ID is required',
                            requestId: c.get('requestId'),
                        },
                    },
                    400
                );
            }

            const membership = await redisConfig.cache(
                `workspace:${unprefixId(workspaceId)}:user:${unprefixId(userId)}`,
                async () => {
                    return await UserWorkspace.findByUserAndWorkspace(userId, workspaceId);
                },
                60 * 15
            );

            if (!membership) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'WORKSPACE_ACCESS_DENIED',
                            message: 'Access denied: Not a member of this workspace',
                            requestId: c.get('requestId'),
                        },
                    },
                    403
                );
            }

            // Check role if specified
            if (requiredRole && !requiredRole.includes(membership.role)) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'INSUFFICIENT_WORKSPACE_ROLE',
                            message: `Access denied: Requires ${requiredRole.join(' or ')} role`,
                            requestId: c.get('requestId'),
                        },
                    },
                    403
                );
            }

            c.workspace = membership;
            await next();
        } catch (error: any) {
            logger.error('Unexpected error in requireWorkspaceMembershipParam middleware', error);

            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'INTERNAL_ERROR',
                        message: 'Internal server error',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    };
};
