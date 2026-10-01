import { AppContext } from '@/core/middlewares/auth.middleware';
import { IErrorResponse, logger } from '@kyrazo/shared';
import { transformService } from './transforms.service';
import {
    CreateTransformResponse,
    DeleteTransformResponse,
    GetTransformByIdResponse,
    GetTransformsResponse,
    GetTransformVersionsResponse,
    RollbackTransformResponse,
    TestTransformResponse,
    UpdateTransformResponse,
} from './transforms.types';
import {
    CreateTransformInput,
    FilterTransformInput,
    GetTransformByIdInput,
    RollbackTransformInput,
    TestTransformInput,
    UpdateTransformInput,
} from './transforms.schema';

export class TransformController {
    static async createTransform(c: AppContext): Promise<Response> {
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
            const valid: CreateTransformInput = c.req.valid('json');
            const saved = await transformService.createTransform(
                valid,
                userId,
                workspaceId.toString(),
                namespaceId.toString()
            );

            return c.json<CreateTransformResponse>(
                {
                    success: true,
                    message: 'Transform created successfully.',
                    data: saved,
                },
                201
            );
        } catch (error: any) {
            logger.error('Unexpected error in TransformController.createTransform', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'CREATE_TRANSFORM_FAILED',
                        message: error.message || 'Failed to create transform',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async getTransforms(c: AppContext): Promise<Response> {
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
            const {
                q,
                isActive,
                limit = 10,
                page = 1,
            }: FilterTransformInput = c.req.valid('query');
            const query: Record<string, unknown> = { workspaceId, namespaceId };
            if (q) query.name = { $regex: q, $options: 'i' };
            if (isActive !== undefined) query.isActive = isActive;

            const perPage = Math.min(limit, 100);
            const { transforms, total } = await transformService.getTransforms(
                query,
                perPage,
                page
            );

            return c.json<GetTransformsResponse>(
                {
                    success: true,
                    message: 'Transforms fetched successfully.',
                    pagination: {
                        total,
                        page,
                        limit: perPage,
                        pages: Math.ceil(total / perPage),
                    },
                    data: transforms,
                },
                200
            );
        } catch (error: any) {
            logger.error('Unexpected error in TransformController.getTransforms', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'GET_TRANSFORMS_FAILED',
                        message: 'Failed to get transforms',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async getTransform(c: AppContext): Promise<Response> {
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
            const { id }: GetTransformByIdInput = c.req.valid('param');
            const transform = await transformService.getTransformById(
                id,
                workspaceId.toString(),
                namespaceId.toString()
            );

            return c.json<GetTransformByIdResponse>(
                {
                    success: true,
                    message: 'Transform fetched successfully.',
                    data: transform,
                },
                200
            );
        } catch (error: any) {
            logger.error('Unexpected error in TransformController.getTransform', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'GET_TRANSFORM_FAILED',
                        message: error.message || 'Failed to get transform',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async updateTransform(c: AppContext): Promise<Response> {
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
            const { id }: GetTransformByIdInput = c.req.valid('param');
            // @ts-ignore
            const valid: UpdateTransformInput = c.req.valid('json');

            const updated = await transformService.updateTransform(
                id,
                workspaceId.toString(),
                namespaceId.toString(),
                valid,
                userId
            );

            return c.json<UpdateTransformResponse>(
                {
                    success: true,
                    message: 'Transform updated successfully.',
                    data: updated,
                },
                200
            );
        } catch (error: any) {
            logger.error('Unexpected error in TransformController.updateTransform', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'UPDATE_TRANSFORM_FAILED',
                        message: error.message || 'Failed to update transform',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async deleteTransform(c: AppContext): Promise<Response> {
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
            const { id }: GetTransformByIdInput = c.req.valid('param');
            const deleted = await transformService.deleteTransform(
                id,
                workspaceId.toString(),
                namespaceId.toString()
            );

            return c.json<DeleteTransformResponse>(
                {
                    success: true,
                    message: 'Transform deactivated successfully.',
                    data: deleted,
                },
                200
            );
        } catch (error: any) {
            logger.error('Unexpected error in TransformController.deleteTransform', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'DELETE_TRANSFORM_FAILED',
                        message: 'Failed to delete transform',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async getVersions(c: AppContext): Promise<Response> {
        try {
            // @ts-ignore
            const { id }: GetTransformByIdInput = c.req.valid('param');
            const versions = await transformService.getVersions(id);

            return c.json<GetTransformVersionsResponse>(
                {
                    success: true,
                    message: 'Versions fetched successfully.',
                    data: versions,
                },
                200
            );
        } catch (error: any) {
            logger.error('Unexpected error in TransformController.getVersions', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'GET_VERSIONS_FAILED',
                        message: 'Failed to get versions',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async rollback(c: AppContext): Promise<Response> {
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
            const { id, version }: RollbackTransformInput = c.req.valid('param');
            const rolledBack = await transformService.rollback(
                id,
                workspaceId.toString(),
                namespaceId.toString(),
                version,
                userId
            );

            return c.json<RollbackTransformResponse>(
                {
                    success: true,
                    message: 'Transform rolled back successfully.',
                    data: rolledBack,
                },
                200
            );
        } catch (error: any) {
            logger.error('Unexpected error in TransformController.rollback', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'ROLLBACK_FAILED',
                        message: error.message || 'Failed to rollback transform',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async testTransform(c: AppContext): Promise<Response> {
        try {
            // @ts-ignore
            const { code, payload }: TestTransformInput = c.req.valid('json');
            const result = await transformService.testTransform(code, payload);

            return c.json<TestTransformResponse>(
                {
                    success: true,
                    message: 'Transform test completed.',
                    data: result,
                },
                200
            );
        } catch (error: any) {
            logger.error('Unexpected error in TransformController.testTransform', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'TEST_TRANSFORM_FAILED',
                        message: error.message || 'Failed to test transform',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }
}
