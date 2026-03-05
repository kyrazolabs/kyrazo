import { redisConfig } from '@/configs';
import { IErrorResponse, IProject, logger, Project, unprefixId } from '@kyrazo/shared';
import { Next } from 'hono';
import { Types } from 'mongoose';
import { AppContext } from './auth.middleware';

/**
 * @title requireProjectAccess Middleware
 * @description Middleware to require project access and (optionally) a specific role. Attaches project access to request.
 */
export const requireProjectAccess = (options?: { allowDeleted?: boolean }) => {
    return async (c: AppContext, next: Next) => {
        try {
            const workspace = c.workspace;
            const projectId = c.req.header('x-project-id');
            if (!workspace || !projectId) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'IDS_MISSING',
                            message: 'Workspace and project ID is required',
                            requestId: c.get('requestId'),
                        },
                    },
                    400
                );
            }

            const access = await redisConfig.cache(
                `workspace:${unprefixId(workspace.workspaceId.toString())}:project:${unprefixId(projectId)}`,
                async () => {
                    if (options?.allowDeleted) {
                        // Allow access to deleted projects for restore operations
                        return await Project.findOne({
                            _id: unprefixId(projectId),
                            workspaceId: unprefixId(workspace.workspaceId.toString()),
                        });
                    } else {
                        // Normal access - only non-deleted projects
                        return await Project.findByWorkspaceAndProject(
                            workspace.workspaceId.toString(),
                            projectId
                        );
                    }
                },
                60 * 15
            );

            if (!access) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'PROJECT_ACCESS_DENIED',
                            message: 'Insufficient permissions to access this project',
                            requestId: c.get('requestId'),
                        },
                    },
                    403
                );
            }

            c.project = {
                ...access,
                projectId: new Types.ObjectId(unprefixId(access.id)),
            } as any;
            await next();
        } catch (error: unknown) {
            logger.error('Unexpected error in requireProjectAccess middleware', error as Error);

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
 * @title requireProjectAccessParam Middleware
 * @description Middleware to require project access and (optionally) a specific role. Attaches project access to request.
 */
export const requireProjectAccessParam = (
    role?: string[],
    options?: { allowDeleted?: boolean }
) => {
    return async (c: AppContext, next: Next) => {
        try {
            const userId = c.user?.userId;
            const workspace = c.workspace;
            const projectId = c.req.param('projectId');

            if (!workspace || !projectId || !userId) {
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

            // parallel fetching
            const access = await redisConfig.cache(
                `workspace:${unprefixId(workspace.workspaceId.toString())}:project:${unprefixId(projectId)}`,
                async () => {
                    if (options?.allowDeleted) {
                        // Allow access to deleted projects for restore operations
                        return await Project.findOne({
                            _id: unprefixId(projectId),
                            workspaceId: unprefixId(workspace.workspaceId.toString()),
                        });
                    } else {
                        // Normal access - only non-deleted projects
                        return await Project.findByWorkspaceAndProject(
                            workspace.workspaceId.toString(),
                            projectId
                        );
                    }
                },
                60 * 15
            );

            if (!access) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'PROJECT_ACCESS_DENIED',
                            message: 'Insufficient permissions to access this project',
                            requestId: c.get('requestId'),
                        },
                    },
                    403
                );
            }

            // Check role if specified
            if (role && workspace?.role && !role.includes(workspace?.role)) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'INSUFFICIENT_WORKSPACE_ROLE',
                            message: `Access denied: Requires ${role.join(' or ')} role`,
                            requestId: c.get('requestId'),
                        },
                    },
                    403
                );
            }

            c.project = {
                ...access,
                projectId: new Types.ObjectId(unprefixId(access.id)),
            } as any;
            await next();
        } catch (error: unknown) {
            logger.error(
                'Unexpected error in requireProjectAccessParam middleware',
                error as Error
            );
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'INTERNAL_ERROR',
                        message: 'Internal server error',
                        details: error as Error,
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    };
};
