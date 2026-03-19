import { redisConfig } from '@/configs';
import { IErrorResponse, INamespace, logger, Namespace, unprefixId } from '@kyrazo/shared';
import { Next } from 'hono';
import { Types } from 'mongoose';
import { AppContext } from './auth.middleware';

/**
 * @title requireNamespaceAccess Middleware
 * @description Middleware to require namespace access and (optionally) a specific role. Attaches namespace access to request.
 */
export const requireNamespaceAccess = (options?: { allowDeleted?: boolean }) => {
    return async (c: AppContext, next: Next) => {
        try {
            const workspace = c.workspace;
            const namespaceId = c.req.header('x-namespace-id');
            if (!workspace || !namespaceId) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'IDS_MISSING',
                            message: 'Workspace and namespace ID is required',
                            requestId: c.get('requestId'),
                        },
                    },
                    400
                );
            }

            const access = await redisConfig.cache(
                `workspace:${unprefixId(workspace.workspaceId.toString())}:namespace:${unprefixId(namespaceId)}`,
                async () => {
                    if (options?.allowDeleted) {
                        // Allow access to deleted namespaces for restore operations
                        return await Namespace.findOne({
                            _id: unprefixId(namespaceId),
                            workspaceId: unprefixId(workspace.workspaceId.toString()),
                        });
                    } else {
                        // Normal access - only non-deleted namespaces
                        return await Namespace.findByWorkspaceAndNamespace(
                            workspace.workspaceId.toString(),
                            namespaceId
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
                            code: 'NAMESPACE_ACCESS_DENIED',
                            message: 'Insufficient permissions to access this namespace',
                            requestId: c.get('requestId'),
                        },
                    },
                    403
                );
            }

            c.namespace = {
                ...access,
                namespaceId: new Types.ObjectId(unprefixId(access.id)),
            } as any;
            await next();
        } catch (error: any) {
            logger.error('Unexpected error in requireNamespaceAccess middleware', error);

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
 * @title requireNamespaceAccessParam Middleware
 * @description Middleware to require namespace access and (optionally) a specific role. Attaches namespace access to request.
 */
export const requireNamespaceAccessParam = (
    role?: string[],
    options?: { allowDeleted?: boolean }
) => {
    return async (c: AppContext, next: Next) => {
        try {
            const userId = c.user?.userId;
            const workspace = c.workspace;
            const namespaceId = c.req.param('namespaceId');

            if (!workspace || !namespaceId || !userId) {
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
                `workspace:${unprefixId(workspace.workspaceId.toString())}:namespace:${unprefixId(namespaceId)}`,
                async () => {
                    if (options?.allowDeleted) {
                        // Allow access to deleted namespaces for restore operations
                        return await Namespace.findOne({
                            _id: unprefixId(namespaceId),
                            workspaceId: unprefixId(workspace.workspaceId.toString()),
                        });
                    } else {
                        // Normal access - only non-deleted namespaces
                        return await Namespace.findByWorkspaceAndNamespace(
                            workspace.workspaceId.toString(),
                            namespaceId
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
                            code: 'NAMESPACE_ACCESS_DENIED',
                            message: 'Insufficient permissions to access this namespace',
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

            c.namespace = {
                ...access,
                namespaceId: new Types.ObjectId(unprefixId(access.id)),
            } as any;
            await next();
        } catch (error: any) {
            logger.error('Unexpected error in requireNamespaceAccessParam middleware', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'INTERNAL_ERROR',
                        message: 'Internal server error',
                        details: error,
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    };
};
