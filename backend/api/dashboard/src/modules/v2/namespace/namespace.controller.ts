import { AppContext } from '@/core/middlewares/auth.middleware';
import { IErrorResponse, logger } from '@kyrazo/shared';
import { namespaceServiceV2 as namespaceService } from './namespace.service';
import {
    CreateNamespaceResponseV2,
    GetNamespacesResponseV2,
    GetNamespaceByIdResponseV2,
    UpdateNamespaceResponseV2,
    DeleteNamespaceResponseV2,
} from './namespace.types';
import {
    CreateNamespaceDto,
    UpdateNamespaceDto,
    SearchNamespaceDto,
    NamespaceIdParamDto,
} from './namespace.types';

export class NamespaceControllerV2 {
    static async createNamespace(c: AppContext): Promise<Response> {
        try {
            const userId = c.user?.userId;
            const workspaceId = c.workspace?.workspaceId;

            if (!userId || !workspaceId) {
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
            const valid: CreateNamespaceDto = c.req.valid('json');
            const namespace = await namespaceService.create(valid, userId, workspaceId.toString());

            return c.json<CreateNamespaceResponseV2>(
                {
                    success: true,
                    message: 'Namespace created successfully',
                    data: namespace,
                },
                201
            );
        } catch (error: any) {
            logger.error('Unexpected error in NamespaceControllerV2.createNamespace', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'CREATE_NAMESPACE_FAILED',
                        message: error.message || 'Failed to create namespace',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async getNamespaceById(c: AppContext): Promise<Response> {
        try {
            const workspaceId = c.workspace?.workspaceId;
            if (!workspaceId) {
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
            const { namespaceId }: NamespaceIdParamDto = c.req.valid('param');
            const namespace = await namespaceService.getById(namespaceId, workspaceId.toString());

            if (!namespace) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'NAMESPACE_NOT_FOUND',
                            message: 'Namespace not found',
                            requestId: c.get('requestId'),
                        },
                    },
                    404
                );
            }

            return c.json<GetNamespaceByIdResponseV2>({
                success: true,
                message: 'Namespace retrieved successfully',
                data: namespace,
            });
        } catch (error: any) {
            logger.error('Unexpected error in NamespaceControllerV2.getNamespaceById', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'GET_NAMESPACE_FAILED',
                        message: error.message || 'Failed to get namespace',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async listNamespaces(c: AppContext): Promise<Response> {
        try {
            const workspaceId = c.workspace?.workspaceId;
            if (!workspaceId) {
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
            const options: SearchNamespaceDto = c.req.valid('query');
            const { namespaces, total } = await namespaceService.gets(
                workspaceId.toString(),
                options
            );

            return c.json<GetNamespacesResponseV2>({
                success: true,
                message: 'Namespaces retrieved successfully',
                pagination: {
                    total,
                    page: options.page,
                    limit: options.limit,
                    pages: Math.ceil(total / options.limit),
                },
                data: namespaces,
            });
        } catch (error: any) {
            logger.error('Unexpected error in NamespaceControllerV2.listNamespaces', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'GET_NAMESPACES_FAILED',
                        message: 'Failed to get namespaces',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async updateNamespace(c: AppContext): Promise<Response> {
        try {
            const userId = c.user?.userId;
            const workspaceId = c.workspace?.workspaceId;

            if (!userId || !workspaceId) {
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
            const { namespaceId }: NamespaceIdParamDto = c.req.valid('param');
            // @ts-ignore
            const valid: UpdateNamespaceDto = c.req.valid('json');

            const namespace = await namespaceService.update(
                namespaceId,
                workspaceId.toString(),
                valid,
                userId
            );

            return c.json<UpdateNamespaceResponseV2>({
                success: true,
                message: 'Namespace updated successfully',
                data: namespace,
            });
        } catch (error: any) {
            logger.error('Unexpected error in NamespaceControllerV2.updateNamespace', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'UPDATE_NAMESPACE_FAILED',
                        message: error.message || 'Failed to update namespace',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async deleteNamespace(c: AppContext): Promise<Response> {
        try {
            const workspaceId = c.workspace?.workspaceId;
            if (!workspaceId) {
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
            const { namespaceId }: NamespaceIdParamDto = c.req.valid('param');
            await namespaceService.delete(namespaceId, workspaceId.toString());

            return c.json<DeleteNamespaceResponseV2>({
                success: true,
                message: 'Namespace deleted successfully',
                data: true,
            });
        } catch (error: any) {
            logger.error('Unexpected error in NamespaceControllerV2.deleteNamespace', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'DELETE_NAMESPACE_FAILED',
                        message: error.message || 'Failed to delete namespace',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async restoreNamespace(c: AppContext): Promise<Response> {
        try {
            const workspaceId = c.workspace?.workspaceId;
            if (!workspaceId) {
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
            const { namespaceId }: NamespaceIdParamDto = c.req.valid('param');
            const namespace = await namespaceService.restore(namespaceId, workspaceId.toString());

            if (!namespace) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'NAMESPACE_NOT_FOUND',
                            message: 'Namespace not found or could not be restored',
                            requestId: c.get('requestId'),
                        },
                    },
                    404
                );
            }

            return c.json<UpdateNamespaceResponseV2>({
                success: true,
                message: 'Namespace restored successfully',
                data: namespace,
            });
        } catch (error: any) {
            logger.error('Unexpected error in NamespaceControllerV2.restoreNamespace', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'RESTORE_NAMESPACE_FAILED',
                        message: error.message || 'Failed to restore namespace',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }
}
