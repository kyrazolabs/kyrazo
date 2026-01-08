import { AppContext } from '@/core/middlewares/auth.middleware';

import { Key, IErrorResponse, logger } from '@kyrazo/shared';
import { keyCrypto, secretCrypto } from '@kyrazo/shared';
import { ICheckScopes, ICreateKey, IGetKey, IRevokeKey } from './key.schema';

export class KeyController {
    static async createKey(c: AppContext) {
        try {
            const userId = c.user?.userId;
            const workspaceId = c.workspace?.workspaceId;

            if (!userId || !workspaceId) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'UNAUTHORIZED_WORKSPACE',
                            message: 'Unauthorized workspace',
                            requestId: c.get('requestId'),
                        },
                    },
                    401
                );
            }
            const { name, scopes, expiresAt }: ICreateKey = c.req.valid('json');

            const { apiKey, metadata } = keyCrypto.generateComplexApiKey({});

            const hashedKey = secretCrypto.hash(apiKey, workspaceId.toString());

            const key = new Key(
                {
                    kid: metadata.kid,
                    key: hashedKey,
                    name,
                    workspace: workspaceId,
                    createBy: userId,
                    scopes,
                    lastFour: apiKey.slice(-4),
                },
                expiresAt
            );
            const saved = await key.save();

            return c.json(
                {
                    success: true,
                    data: {
                        _id: saved._id,
                        name: saved.name,
                        lastFour: saved.lastFour,
                        scopes: saved.scopes,
                        expiresAt: saved.expiresAt,
                        key: apiKey,
                    },
                    message: 'API key has been created successfully.',
                },
                201
            );
        } catch (error: unknown) {
            logger.error(
                'Unexpected error in KeyController.createKey',
                error as Error
            );
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'CREATE_API_KEY_FAILED',
                        message: 'Failed to create api',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async getKeysSchema(c: AppContext) {
        try {
            const workspaceId = c.workspace?.workspaceId;

            if (!workspaceId) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'UNAUTHORIZED_WORKSPACE',
                            message: 'Unauthorized workspace',
                            requestId: c.get('requestId'),
                        },
                    },
                    401
                );
            }
            const { q, limit = 10, page = 1 }: IGetKey = c.req.valid('query');

            const query: any = { workspace: workspaceId };

            if (q) query.$text = { $search: q };

            const perPage = Math.min(limit, 100);
            const skip = (page - 1) * perPage;
            const [keys, total] = await Promise.all([
                Key.find(query)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(perPage)
                    .lean(),
                Key.countDocuments(query),
            ]);

            return c.json(
                {
                    success: true,
                    pagination: {
                        total,
                        page,
                        limit: perPage,
                        pages: Math.ceil(total / perPage),
                    },
                    data: keys,
                },
                200
            );
        } catch (error) {
            return c.json(
                {
                    success: false,
                    error: {
                        code: 'GET_KEYS_FAILED',
                        message: 'Failed to get keys',
                        details: error,
                    },
                },
                500
            );
        }
    }

    static async checkScopes(c: AppContext) {
        try {
            const workspaceId = c.workspace?.workspaceId;

            if (!workspaceId) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'UNAUTHORIZED_WORKSPACE',
                            message: 'Unauthorized workspace',
                            requestId: c.get('requestId'),
                        },
                    },
                    401
                );
            }
            const { keyId }: ICheckScopes = c.req.valid('param');

            const data = await Key.findOne({
                _id: keyId,
                workspace: workspaceId,
            });

            return c.json(
                {
                    success: true,
                    message: 'Check Scopes has been checked Successfully',
                    data: {
                        _id: data?._id,
                        scopes: data?.scopes,
                    },
                },
                200
            );
        } catch (error) {
            return c.json(
                {
                    success: false,
                    error: {
                        code: 'CHECK_KEY_SCOPES_FAILED',
                        message: 'Failed to check key scopes',
                    },
                },
                500
            );
        }
    }

    static async deleteKey(c: AppContext) {
        try {
            const workspaceId = c.workspace?.workspaceId;

            if (!workspaceId) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'UNAUTHORIZED_WORKSPACE',
                            message: 'Unauthorized workspace',
                            requestId: c.get('requestId'),
                        },
                    },
                    401
                );
            }
            const { keyId }: IRevokeKey = c.req.valid('param');

            await Key.findOneAndDelete({ _id: keyId, workspace: workspaceId });

            return c.json(
                {
                    success: true,
                    message: 'Key has been deleted Successfully',
                },
                200
            );
        } catch (error) {
            return c.json(
                {
                    success: false,
                    error: {
                        code: 'DELETE_KEY_FAILED',
                        message: 'Failed to delete key',
                    },
                },
                500
            );
        }
    }
}
