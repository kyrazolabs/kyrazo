import { Types } from 'mongoose';
import { IErrorResponse, ISource, logger, Source } from '@kyrazo/shared';
import {
    CreateSourceResponse,
    DeleteSourceResponse,
    GetSourceResponse,
    GetSourcesResponse,
    UpdateSourceResponse,
} from './source.type';
import { generateIngressId, decryptSourceSecrets } from '@kyrazo/shared';
import { AppContext } from '@/core/middlewares/auth.middleware';
import {
    SourceAuthType,
    CreateSourceInput,
    GetSourceByIdInput,
    FilterSourcesInput,
    UpdateSourceInput,
} from './source.schema';
import { secretCrypto } from '@kyrazo/shared';

export class SourceController {
    static async createSource(c: AppContext): Promise<Response> {
        try {
            const userId = c.user?.userId;
            const workspaceId = c.workspace?.workspaceId;
            const projectId = c.project?.projectId;

            if (!userId || !workspaceId || !projectId) {
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

            // Validate input using Zod schema
            const valid: CreateSourceInput = c.req.valid('json');

            // Prepare source data with proper typing
            const data = {
                ...valid,
                userId: new Types.ObjectId(userId),
                workspaceId: new Types.ObjectId(workspaceId),
                projectId: new Types.ObjectId(projectId),
            };

            if (!valid.authentication?.enabled) {
                return c.json(
                    {
                        success: false,
                        message:
                            'Authentication is required for receive type sources.',
                    },
                    400
                );
            }

            // Handle different authentication types for receive sources
            let processedAuth: any;

            if (
                valid.authentication.type === 'service' &&
                valid.authentication.service
            ) {
                const encrypted = secretCrypto.encrypt(
                    projectId.toString(),
                    valid.authentication.service.secret
                );
                processedAuth = {
                    enabled: true,
                    type: 'service' as SourceAuthType,
                    credentials: {
                        secret: encrypted.encrypted,
                        iv: encrypted.iv,
                    },
                };
                // } else if (valid.authentication.type === 'hmac' && valid.authentication.hmac) {
                //     const encrypted = encryptSecret(valid.authentication.hmac.signingSecret);
                //     processedAuth = {
                //         enabled: true,
                //         type: 'hmac' as SourceAuthType,
                //         credentials: {
                //             ...valid.authentication.hmac,
                //             signingSecret: encrypted.encryptedSecret,
                //             iv: encrypted.iv,
                //         },
                //     };
            } else if (
                valid.authentication.type === 'api_key' &&
                valid.authentication.apiKey
            ) {
                const encrypted = secretCrypto.encrypt(
                    projectId.toString(),
                    valid.authentication.apiKey.apiKey
                );
                processedAuth = {
                    enabled: true,
                    type: 'api_key' as SourceAuthType,
                    credentials: {
                        ...valid.authentication.apiKey,
                        apiKey: encrypted.encrypted,
                        iv: encrypted.iv,
                    },
                };
            } else if (
                valid.authentication.type === 'basic_auth' &&
                valid.authentication.basicAuth
            ) {
                const encrypted = secretCrypto.encrypt(
                    projectId.toString(),
                    valid.authentication.basicAuth.password
                );
                processedAuth = {
                    enabled: true,
                    type: 'basic_auth' as SourceAuthType,
                    credentials: {
                        ...valid.authentication.basicAuth,
                        password: encrypted.encrypted,
                        iv: encrypted.iv,
                    },
                };
            }

            const source = new Source({
                ...data,
                ingressId: generateIngressId(userId),
                forwarding: valid.forwarding,
                endpoints: valid.endpoints,
                authentication: processedAuth,
            });

            const saved = await source.save();

            if (!saved) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'FLAILED_CREATE_WEBHOOK',
                            message: 'Failed to create a source.',
                            requestId: c.get('requestId'),
                        },
                    },
                    400
                );
            }

            return c.json<CreateSourceResponse>(
                {
                    success: true,
                    message: 'Source has been created successfully.',
                    data: {
                        sourceId: saved._id,
                        ingress: `http://localhost:3003/v1/ingest/${saved.ingressId}`,
                    },
                },
                201
            );
        } catch (error: unknown) {
            logger.error('Error in createSource:', error as Error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'CREATE_WEBHOOK_FAILED',
                        message: 'Failed to create new source',
                        details: error instanceof Error ? error.message : error,
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async getSource(c: AppContext): Promise<Response> {
        try {
            const workspaceId = c.workspace?.workspaceId;
            const projectId = c.project?.projectId;

            if (!workspaceId || !projectId) {
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

            const data: GetSourceByIdInput = c.req.valid('param');

            const source = await Source.findOne({
                _id: data.sourceId,
                workspaceId: workspaceId,
                projectId: projectId,
            })
                .populate('endpoints')
                .exec();

            if (!source) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'WEBHOOK_NOT_FOUND',
                            message:
                                'Source not found or you do not have permission.',
                            requestId: c.get('requestId'),
                        },
                    },
                    404
                );
            }

            // Decrypt secrets before returning
            const decryptedSource: ISource = decryptSourceSecrets(
                source.toObject()
            );

            return c.json<GetSourceResponse>(
                {
                    success: true,
                    message: "Here's the source data that you asked",
                    data: decryptedSource,
                },
                200
            );
        } catch (error: unknown) {
            return c.json(
                {
                    success: false,
                    error: {
                        code: 'GET_WEBHOOK_FAILED',
                        message: 'Failed to get source',
                        details: error instanceof Error ? error.message : error,
                    },
                },
                500
            );
        }
    }

    static async getSources(c: AppContext): Promise<Response> {
        try {
            const workspaceId = c.workspace?.workspaceId;
            const projectId = c.project?.projectId;
            if (!workspaceId || !projectId) {
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
            const {
                q,
                status,
                limit = 10,
                page = 1,
            }: FilterSourcesInput = c.req.valid('query');

            const query: Record<string, unknown> = {
                workspaceId,
                projectId,
            };

            if (q) query.$text = { $search: q };
            if (status) query.status = status;

            const perPage = Math.min(limit, 100);
            const skip = (page - 1) * perPage;
            const [sources, total] = await Promise.all([
                Source.find(query)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(perPage)
                    .lean(),
                Source.countDocuments(query),
            ]);

            // Decrypt secrets for all sources before returning
            const decryptedSources: Array<ISource> = sources.map(source =>
                decryptSourceSecrets(source)
            );

            return c.json<GetSourcesResponse>(
                {
                    success: true,
                    pagination: {
                        total,
                        page,
                        limit: perPage,
                        pages: Math.ceil(total / perPage),
                    },
                    data: decryptedSources,
                },
                200
            );
        } catch (error: unknown) {
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'GET_WEBHOOKS_FAILED',
                        message: 'Failed to get sources',
                        details: error instanceof Error ? error.message : error,
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async updateSource(c: AppContext): Promise<Response> {
        try {
            const workspaceId = c.workspace?.workspaceId;
            const projectId = c.project?.projectId;

            if (!workspaceId || !projectId) {
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

            const { sourceId }: GetSourceByIdInput = c.req.valid('param');
            const data: UpdateSourceInput = c.req.valid('json');

            const updated = await Source.findOneAndUpdate(
                {
                    _id: sourceId,
                    workspaceId: workspaceId,
                    projectId: projectId,
                },
                { $set: data },
                { new: true }
            ).lean();

            if (!updated) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'WEBHOOK_NOT_FOUND',
                            message:
                                'Source not found or you do not have permission.',
                            requestId: c.get('requestId'),
                        },
                    },
                    400
                );
            }

            // Decrypt secrets before returning the updated source
            const decryptedSource: ISource = decryptSourceSecrets(updated);

            return c.json<UpdateSourceResponse>({
                success: true,
                message: 'Source updated successfully.',
                data: {
                    source: decryptedSource,
                },
            });
        } catch (error: unknown) {
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'UPDATE_WEBHOOK_FAILED',
                        message: 'Failed to update source',
                        details: error instanceof Error ? error.message : error,
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async deleteSource(c: AppContext): Promise<Response> {
        try {
            const userId = c.user?.userId;
            const projectId = c.project?.projectId;

            if (!userId || !projectId) {
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

            const { sourceId }: GetSourceByIdInput = c.req.valid('param');

            const deleted = await Source.findOneAndDelete({
                _id: sourceId,
                userId: userId,
                projectId: projectId,
            });

            if (!deleted) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'WEBHOOK_NOT_FOUND',
                            message:
                                'Source not found or you do not have permission.',
                            requestId: c.get('requestId'),
                        },
                    },
                    400
                );
            }

            return c.json<DeleteSourceResponse>(
                {
                    success: true,
                    message: 'Source deleted successfully.',
                },
                200
            );
        } catch (error: unknown) {
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'DELETE_WEBHOOK_FAILED',
                        message: 'Failed to delete source',
                        details: error instanceof Error ? error.message : error,
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }
}
