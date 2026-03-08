import { AppContext } from '@/core/middlewares/auth.middleware';
import { IErrorResponse, logger } from '@kyrazo/shared';
import { targetService } from './target.service';
import {
    CreateTargetResponse,
    DeleteTargetResponse,
    GetTargetByIdResponse,
    GetTargetSecretResponse,
    GetTargetsResponse,
    UpdateTargetResponse,
} from './target.types';
import {
    CreateTargetInput,
    FilterTargetInput,
    GetTargetByIdInput,
    UpdateTargetInput,
    UpdateTargetStatusInput,
} from './target.schema';

export class TargetController {
    static async createTarget(c: AppContext): Promise<Response> {
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
            const valid: CreateTargetInput = c.req.valid('json');
            const saved = await targetService.createTarget(valid, userId, workspaceId, namespaceId);

            return c.json<CreateTargetResponse>(
                {
                    success: true,
                    message: 'Target added successfully.',
                    data: saved,
                },
                201
            );
        } catch (error) {
            logger.error('Unexpected error in TargetController.createTarget', error as Error);
            if ((error as Error).message.includes('E11000')) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'TARGET_ALREADY_EXISTS',
                            message: 'Target already exists',
                            requestId: c.get('requestId'),
                        },
                    },
                    400
                );
            }
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'CREATE_TARGET_FAILED',
                        message: 'Failed to add new target',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }
    static async getTargets(c: AppContext): Promise<Response> {
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
            const { q, enabled, limit = 10, page = 1 }: FilterTargetInput = c.req.valid('query');

            const query: Record<string, unknown> = { workspaceId, namespaceId };
            if (q) query.$text = { $search: q };
            if (enabled) query.enabled = enabled;
            const perPage = Math.min(limit, 100);

            const { targets, total } = await targetService.getTargets(query, perPage, page);

            return c.json<GetTargetsResponse>(
                {
                    success: true,
                    message: 'Targets fetched successfully.',
                    pagination: {
                        total,
                        page,
                        limit: perPage,
                        pages: Math.ceil(total / perPage),
                    },
                    data: targets,
                },
                200
            );
        } catch (error) {
            logger.error('Unexpected error in TargetController.getTargets', error as Error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'GET_TARGETS_FAILED',
                        message: 'Failed to get targets',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }
    static async getTarget(c: AppContext): Promise<Response> {
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
            const { targetId }: GetTargetByIdInput = c.req.valid('param');

            const target = await targetService.getTargetById(
                targetId,
                workspaceId.toString(),
                namespaceId.toString()
            );
            return c.json<GetTargetByIdResponse>(
                {
                    success: true,
                    message: 'Target fetched successfully.',
                    data: target,
                },
                200
            );
        } catch (error) {
            logger.error('Unexpected error in TargetController.getTarget', error as Error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'GET_TARGET_FAILED',
                        message: 'Failed to get target',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }
    static async getTargetSecret(c: AppContext): Promise<Response> {
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
            const { targetId }: GetTargetByIdInput = c.req.valid('param');

            const secret = await targetService.getTargetSecret(
                targetId,
                workspaceId.toString(),
                namespaceId.toString()
            );
            return c.json<GetTargetSecretResponse>(
                {
                    success: true,
                    message: 'Target fetched successfully.',
                    data: secret,
                },
                200
            );
        } catch (error) {
            logger.error('Unexpected error in TargetController.getTargetSecret', error as Error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'GET_TARGET_SECRET_FAILED',
                        message: 'Failed to get target secret',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }
    static async updateTarget(c: AppContext): Promise<Response> {
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
            const { targetId }: GetTargetByIdInput = c.req.valid('param');
            const valid: UpdateTargetInput = c.req.valid('json');
            const target = await targetService.updateTarget(
                targetId,
                workspaceId.toString(),
                namespaceId.toString(),
                valid
            );
            return c.json<UpdateTargetResponse>(
                {
                    success: true,
                    message: 'Target updated successfully.',
                    data: target,
                },
                200
            );
        } catch (error) {
            logger.error('Unexpected error in TargetController.updateTarget', error as Error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'UPDATE_TARGET_FAILED',
                        message: 'Failed to update target',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }
    static async updateTargetStatus(c: AppContext): Promise<Response> {
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
            const { targetId, enabled }: UpdateTargetStatusInput = c.req.valid('json');
            const target = await targetService.updateTarget(
                targetId,
                workspaceId.toString(),
                namespaceId.toString(),
                { enabled }
            );
            return c.json<UpdateTargetResponse>(
                {
                    success: true,
                    message: 'Target updated successfully.',
                    data: target,
                },
                200
            );
        } catch (error) {
            logger.error('Unexpected error in TargetController.updateTarget', error as Error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'UPDATE_TARGET_FAILED',
                        message: 'Failed to update target',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }
    static async deleteTarget(c: AppContext): Promise<Response> {
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
            const { targetId }: GetTargetByIdInput = c.req.valid('param');
            const deleted = await targetService.deleteTarget(
                targetId,
                workspaceId.toString(),
                namespaceId.toString()
            );
            return c.json<DeleteTargetResponse>(
                {
                    success: true,
                    message: 'Target deleted successfully.',
                    data: deleted,
                },
                200
            );
        } catch (error) {
            logger.error('Unexpected error in TargetController.deleteTarget', error as Error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'DELETE_TARGET_FAILED',
                        message: 'Failed to delete target',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }
}
