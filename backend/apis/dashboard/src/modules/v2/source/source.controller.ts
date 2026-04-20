import { AppContext } from '@/core/middlewares/auth.middleware';
import { IErrorResponse, logger } from '@kyrazo/shared';
import { sourceServiceV2 as sourceService } from './source.service';
import { transformService } from '../transforms/transforms.service';
import {
    CreateSourceResponseV2,
    DeleteSourceResponseV2,
    GetSourceByIdResponseV2,
    GetSourcesResponseV2,
    UpdateSourceResponseV2,
} from './source.types';
import {
    CreateSourceDto,
    UpdateSourceDto,
    SourceIdParamDto,
    SearchSourceDto,
} from './source.types';

export class SourceControllerV2 {
    static async create(c: AppContext): Promise<Response> {
        try {
            const userId = c.user?.userId;
            const workspaceId = c.workspace?.workspaceId;
            const namespaceId = c.namespace?.namespaceId;

            if (!userId || !workspaceId || !namespaceId) {
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
            const valid: CreateSourceDto = c.req.valid('json');
            const saved = await sourceService.create(
                valid,
                userId,
                workspaceId.toString(),
                namespaceId.toString()
            );

            return c.json<CreateSourceResponseV2>(
                {
                    success: true,
                    message: 'Source created successfully.',
                    data: saved,
                },
                201
            );
        } catch (error: any) {
            logger.error('Unexpected error in SourceControllerV2.create', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'CREATE_SOURCE_FAILED',
                        message: error.message || 'Failed to create source',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async list(c: AppContext): Promise<Response> {
        try {
            const workspaceId = c.workspace?.workspaceId;
            const namespaceId = c.namespace?.namespaceId;

            if (!workspaceId || !namespaceId) {
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
            const options: SearchSourceDto = c.req.valid('query');
            const { sources, total } = await sourceService.gets(
                workspaceId.toString(),
                namespaceId.toString(),
                options
            );

            return c.json<GetSourcesResponseV2>(
                {
                    success: true,
                    message: 'Sources fetched successfully.',
                    pagination: {
                        total,
                        page: options.page,
                        limit: options.limit,
                        pages: Math.ceil(total / options.limit),
                    },
                    data: sources,
                },
                200
            );
        } catch (error: any) {
            logger.error('Unexpected error in SourceControllerV2.list', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'GET_SOURCES_FAILED',
                        message: 'Failed to get sources',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async get(c: AppContext): Promise<Response> {
        try {
            const workspaceId = c.workspace?.workspaceId;
            const namespaceId = c.namespace?.namespaceId;

            if (!workspaceId || !namespaceId) {
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
            const { id }: SourceIdParamDto = c.req.valid('param');
            const source = await sourceService.getById(
                id,
                workspaceId.toString(),
                namespaceId.toString()
            );

            if (!source) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'SOURCE_NOT_FOUND',
                            message: 'Source not found',
                            requestId: c.get('requestId'),
                        },
                    },
                    404
                );
            }

            return c.json<GetSourceByIdResponseV2>(
                {
                    success: true,
                    message: 'Source fetched successfully.',
                    data: source,
                },
                200
            );
        } catch (error: any) {
            logger.error('Unexpected error in SourceControllerV2.get', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'GET_SOURCE_FAILED',
                        message: error.message || 'Failed to get source',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async update(c: AppContext): Promise<Response> {
        try {
            const userId = c.user?.userId;
            const workspaceId = c.workspace?.workspaceId;
            const namespaceId = c.namespace?.namespaceId;

            if (!userId || !workspaceId || !namespaceId) {
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
            const { id }: SourceIdParamDto = c.req.valid('param');
            // @ts-ignore
            const valid: UpdateSourceDto = c.req.valid('json');

            const updated = await sourceService.update(
                id,
                workspaceId.toString(),
                namespaceId.toString(),
                valid,
                userId
            );

            return c.json<UpdateSourceResponseV2>(
                {
                    success: true,
                    message: 'Source updated successfully.',
                    data: updated,
                },
                200
            );
        } catch (error: any) {
            logger.error('Unexpected error in SourceControllerV2.update', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'UPDATE_SOURCE_FAILED',
                        message: error.message || 'Failed to update source',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async delete(c: AppContext): Promise<Response> {
        try {
            const workspaceId = c.workspace?.workspaceId;
            const namespaceId = c.namespace?.namespaceId;

            if (!workspaceId || !namespaceId) {
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
            const { id }: SourceIdParamDto = c.req.valid('param');
            const deleted = await sourceService.delete(
                id,
                workspaceId.toString(),
                namespaceId.toString()
            );

            return c.json<DeleteSourceResponseV2>(
                {
                    success: true,
                    message: 'Source deleted successfully.',
                    data: deleted,
                },
                200
            );
        } catch (error: any) {
            logger.error('Unexpected error in SourceControllerV2.delete', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'DELETE_SOURCE_FAILED',
                        message: error.message || 'Failed to delete source',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }
}
