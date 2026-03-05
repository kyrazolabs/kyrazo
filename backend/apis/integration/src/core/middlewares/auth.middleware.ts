import { Context, type Next } from 'hono';
import { getConnInfo } from 'hono/bun';
import { ipRestriction } from 'hono/ip-restriction';

import type { IErrorResponse, IProject } from '@kyrazo/shared';
import { Key, logger, Project, unprefixId } from '@kyrazo/shared';
import { redisConfig } from '@/configs';
import { keyCrypto, secretCrypto, config } from '@kyrazo/shared';
import { Types } from 'mongoose';

export type AppContext = Context & {
    key?: {
        name: string;
        permissions: string[];
    };
    workspace?: { workspaceId: Types.ObjectId };
    project?: IProject & { projectId: Types.ObjectId };
    userId?: string;
    idempotencyKey?: string;
};

/**
 * @title authenticate Middleware
 * @description Middleware to authenticate requests using an API key (JWT). Attaches user and API key info to request.
 */
export const authenticate = async (c: AppContext, next: Next) => {
    try {
        const apiKey = c.req.header('x-api-key') as string;
        const projectId = c.req.param('projectId');

        if (!apiKey) {
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'API_KEY_MISSING',
                        message: 'API key is required',
                        requestId: c.get('requestId'),
                    },
                },
                401
            );
        }

        if (!projectId) {
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'PROJECT_ID_MISSING',
                        message: 'Project Id is required',
                        requestId: c.get('requestId'),
                    },
                },
                401
            );
        }

        // Verify API key token
        const key = keyCrypto.verifyComplexApiKey(apiKey);
        if (!key.valid) {
            logger.warn('Auth failed: Invalid API key format or signature', {
                requestId: c.get('requestId'),
            });
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'INVALID_API_KEY',
                        message: 'Invalid API key or user inactive',
                        requestId: c.get('requestId'),
                    },
                },
                401
            );
        }

        const workspace = await redisConfig.cache(
            `workspace:kid:${key.parts.kid}:with-user`,
            async () => {
                return await Key.findOne({
                    kid: key.parts.kid,
                })
                    .populate('workspace', ['_id'])
                    .select('+key +kid');
            },
            60
        );

        if (!workspace) {
            logger.warn(`Auth failed: Key not found for kid: ${key.parts.kid}`, {
                requestId: c.get('requestId'),
                kid: key.parts.kid,
            });
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'INVALID_API_KEY',
                        message: 'Invalid API key or workspace inactive',
                        requestId: c.get('requestId'),
                    },
                },
                401
            );
        }

        if (!workspace.isEnabled) {
            logger.warn(`Auth failed: Key is disabled for kid: ${key.parts.kid}`, {
                requestId: c.get('requestId'),
                kid: key.parts.kid,
            });
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'INVALID_API_KEY',
                        message: 'Invalid API key or workspace inactive',
                        requestId: c.get('requestId'),
                    },
                },
                401
            );
        }

        if (!workspace.workspace) {
            logger.warn(`Auth failed: Workspace object missing for kid: ${key.parts.kid}`, {
                requestId: c.get('requestId'),
                kid: key.parts.kid,
            });
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'INVALID_API_KEY',
                        message: 'Invalid API key or workspace inactive',
                        requestId: c.get('requestId'),
                    },
                },
                401
            );
        }

        const hashedKey = secretCrypto.hash(apiKey, unprefixId((workspace.workspace as any).id)!);

        if (hashedKey !== workspace.key) {
            logger.warn(`Auth failed: Key hash mismatch for kid: ${key.parts.kid}`, {
                requestId: c.get('requestId'),
                kid: key.parts.kid,
                providedApiKey: '***',
                workspaceId: (workspace.workspace as any).id || 'MISSING_WORKSPACE',
                generatedHash: hashedKey,
                storedHash: workspace.key,
                encryptionKeyPrefix: config.security.encryptions.key
                    ? config.security.encryptions.key.substring(0, 4)
                    : 'MISSING',
            });
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'INVALID_API_KEY',
                        message: 'Invalid API key or workspace inactive',
                        requestId: c.get('requestId'),
                    },
                },
                401
            );
        }

        // IP Whitelisting Check
        if (workspace.ipWhitelist && workspace.ipWhitelist.length > 0) {
            const clientIp =
                c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
                c.req.header('x-real-ip') ||
                getConnInfo(c).remote.address ||
                (c.req.raw as any).socket?.remoteAddress;

            if (clientIp && !workspace.ipWhitelist.includes(clientIp)) {
                logger.warn(`Auth failed: IP not whitelisted: ${clientIp}`, {
                    requestId: c.get('requestId'),
                    kid: key.parts.kid,
                    whitelist: workspace.ipWhitelist,
                });
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'IP_NOT_WHITELISTED',
                            message: 'Your IP address is not whitelisted for this API key',
                            requestId: c.get('requestId'),
                        },
                    },
                    403
                );
            }
        }

        const project = await Project.findById(unprefixId(projectId));

        if (!project) {
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'INVALID_PROJECT',
                        message: 'Project not found',
                        requestId: c.get('requestId'),
                    },
                },
                404
            );
        }

        const owner = workspace.workspace;
        const workspacePayload: { workspaceId: Types.ObjectId } = {
            workspaceId: new Types.ObjectId(unprefixId((workspace.workspace as any).id)!),
        };

        c.workspace = workspacePayload;
        // @ts-ignore - project is IProject & { projectId: Types.ObjectId }
        c.project = Object.assign(project, { projectId: project._id });
        c.userId = unprefixId(workspace.createBy.toString());
        c.key = {
            name: workspace.name,
            permissions: workspace.scopes,
        };

        await next();
    } catch (error) {
        logger.error('API key authentication error:', error as Error);
        return c.json<IErrorResponse>(
            {
                success: false,
                error: {
                    code: 'INVALID_API_KEY',
                    message: 'Invalid API key',
                    details: error as Error,
                    requestId: c.get('requestId'),
                },
            },
            401
        );
    }
};

export const checkScope = (requiredScope: string) => {
    return async (c: AppContext, next: Next) => {
        try {
            const apiKey = c.key;

            if (!apiKey || !apiKey.permissions.includes(requiredScope)) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'INSUFFICIENT_KEY_ROLE',
                            message: `Insufficient role: ${requiredScope}`,
                            requestId: c.get('requestId'),
                        },
                    },
                    403
                );
            }

            await next();
        } catch (error: unknown) {
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
