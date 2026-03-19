import { Context, Next } from 'hono';

import {
    IErrorResponse,
    INamespace,
    IUserWorkspace,
    logger,
    Namespace,
    UserWorkspace,
    unprefixId,
} from '@kyrazo/shared';
import { config } from '@/configs';
import { getSignedCookie } from 'hono/cookie';
import { authUtils, JWTPayload } from '@/core/utils/libs/jwt';
import { Types } from 'mongoose';

export interface AppContext extends Context {
    user?: JWTPayload;
    workspace?: IUserWorkspace;
    namespace?: INamespace & { namespaceId: Types.ObjectId };
}

/**
 * @title Middleware to verify JWT token and attach user to context
 */
export const authenticate = async (c: AppContext, next: Next) => {
    try {
        const authHeader = c.req.header('Authorization');
        const cookieToken = await getSignedCookie(c, config.jwt.secrets.access, 'access_token');
        const hasHeader = authHeader && authHeader.startsWith('Bearer ');
        const hasCookie = typeof cookieToken === 'string' && cookieToken.length > 0;

        // If neither header token nor cookie token exists
        if (!hasHeader && !hasCookie) {
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'MISSING_TOKEN',
                        message: 'Access token is required',
                        requestId: c.get('requestId'),
                    },
                },
                401
            );
        }

        // Pick whichever is available
        const token = hasHeader ? authHeader!.substring(7) : (cookieToken as string);

        const result = authUtils.verifyAccessToken(token);

        if (!result.valid) {
            const code = result.reason === 'expired' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
            const message =
                result.reason === 'expired'
                    ? 'Access token expired, please refresh'
                    : 'Invalid access token, please login again';

            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: { code, message, requestId: c.get('requestId') },
                },
                401
            );
        }

        c.user = result.payload;

        await next();
    } catch (error: any) {
        return c.json<IErrorResponse>(
            {
                success: false,
                error: {
                    code: 'AUTH_ERROR',
                    message: 'Authentication failed',
                    details: error,
                    requestId: c.get('requestId'),
                },
            },
            401
        );
    }
};

/**
 * @title requireOwnership Middleware
 * @description Middleware to require ownership of a resource (ws, ns, etc.). Proceeds only if the user is the owner.
 */
export const requireOwnership = (resourceType: 'workspace' | 'namespace') => {
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

            const body = await c.req.json();
            const resourceId =
                c.req.param(`${resourceType}Id`) ||
                body[`${resourceType}Id`] ||
                c.req.query(`${resourceType}Id`) ||
                c.req.header(`x-${resourceType}-id`);
            if (!resourceId) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'RESOURCE_ID_MISSING',
                            message: `${resourceType} ID is required`,
                            requestId: c.get('requestId'),
                        },
                    },
                    400
                );
            }

            let isOwner = false;

            switch (resourceType) {
                case 'workspace':
                    isOwner = await UserWorkspace.isUserOwner(
                        unprefixId(userId)!,
                        unprefixId(resourceId)!
                    );
                    break;
                case 'namespace':
                    isOwner = await Namespace.isUserOwner(
                        unprefixId(userId)!,
                        unprefixId(resourceId)!
                    );
                    break;
                default:
                    break;
            }

            if (!isOwner) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'OWNERSHIP_REQUIRED',
                            message: `Access denied: Must be owner of this ${resourceType}`,
                            requestId: c.get('requestId'),
                        },
                    },
                    403
                );
            }

            await next();
        } catch (error: any) {
            logger.error('Ownership check error:', error);
            return c.json(
                {
                    success: false,
                    message: 'Internal server error',
                    code: 'INTERNAL_ERROR',
                },
                500
            );
        }
    };
};
