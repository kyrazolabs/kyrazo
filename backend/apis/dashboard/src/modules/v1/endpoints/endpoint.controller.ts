import { AppContext } from '@/core/middlewares/auth.middleware';
import { IEndpoint, IErrorResponse } from '@kyrazo/shared';
import {
    CreateEndpointResponse,
    DeleteEndpointResponse,
    GetEndpointResponse,
    GetEndpointsResponse,
    GetEndpointSecretResponse,
    UpdateEndpointResponse,
} from './endpoint.types';
import {
    CreateEndpointInput,
    FilterEndpointInput,
    GetEndpointByIdInput,
    UpdateEndpointInput,
    UpdateEndpointStatusInput,
} from './endpoint.schema';
import { logger } from '@/configs';
import { endpointService } from './endpoint.service';

export class EndpointController {
    static async createEndpoint(c: AppContext): Promise<Response> {
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
            const valid: CreateEndpointInput = c.req.valid('json');
            const saved = await endpointService.createEndpoint(
                valid,
                userId,
                workspaceId,
                projectId
            );

            return c.json<CreateEndpointResponse>(
                {
                    success: true,
                    message: 'Endpoint added successfully.',
                    data: {
                        endpoint: saved,
                    },
                },
                201
            );
        } catch (error: unknown) {
            logger.error(
                'Unexpected error in EndpointController.createEndpoint',
                error as Error
            );
            if ((error as Error).message.includes('E11000')) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'ENDPOINT_ALREADY_EXISTS',
                            message: 'Endpoint already exists',
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
                        code: 'CREATE_ENDPOINT_FAILED',
                        message: 'Failed to add new endpoint',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async getEndpoint(c: AppContext): Promise<Response> {
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
            const { endpointId }: GetEndpointByIdInput = c.req.valid('param');

            const endpoint = await endpointService.getEndpointById(
                endpointId,
                workspaceId.toString(),
                projectId.toString()
            );

            return c.json<GetEndpointResponse>(
                {
                    success: true,
                    message: "Here's the endpoint data that you asked",
                    data: endpoint as IEndpoint,
                },
                200
            );
        } catch (error: unknown) {
            logger.error(
                'Unexpected error in EndpointController.getEndpoint',
                error as Error
            );
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'GET_ENDPOINT_FAILED',
                        message: 'Failed to get endpoint',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async getEndpointSecret(c: AppContext): Promise<Response> {
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
            const { endpointId }: GetEndpointByIdInput = c.req.valid('param');

            const secret = await endpointService.getEndpointSecret(
                endpointId,
                workspaceId.toString(),
                projectId.toString()
            );

            return c.json<GetEndpointSecretResponse>(
                {
                    success: true,
                    message: 'Endpoint secret fetched successfully.',
                    data: secret,
                },
                200
            );
        } catch (error) {
            logger.error(
                'Unexpected error in EndpointController.getEndpointSecret',
                error as Error
            );
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'GET_ENDPOINT_SECRET_FAILED',
                        message: 'Failed to get endpoint secret',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async getEndpoints(c: AppContext): Promise<Response> {
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
            }: FilterEndpointInput = c.req.valid('query');

            const query: Record<string, unknown> = { workspaceId, projectId };

            if (q) query.$text = { $search: q };
            if (status) query.status = status;

            const { endpoints, total } = await endpointService.getEndpoints(
                query,
                limit,
                page
            );

            return c.json<GetEndpointsResponse>(
                {
                    success: true,
                    pagination: {
                        total,
                        page,
                        limit,
                        pages: Math.ceil(total / limit),
                    },
                    data: endpoints,
                },
                200
            );
        } catch (error: unknown) {
            logger.error(
                'Unexpected error in EndpointController.getEndpoints',
                error as Error
            );
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'GET_ENDPOINTS_FAILED',
                        message: 'Failed to get endpoints',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async updateEndpointStatus(c: AppContext): Promise<Response> {
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
            const { endpointId, status }: UpdateEndpointStatusInput =
                c.req.valid('param');

            if (!['active', 'inactive'].includes(status)) {
                return c.json<IErrorResponse>(
                    {
                        success: false,
                        error: {
                            code: 'INVALID_STATUS',
                            message:
                                'Status must be either "active" or "inactive"',
                            requestId: c.get('requestId'),
                        },
                    },
                    400
                );
            }

            const updated = await endpointService.updateEndpoint(
                endpointId,
                workspaceId.toString(),
                projectId.toString(),
                { status }
            );

            return c.json<UpdateEndpointResponse>(
                {
                    success: true,
                    message: `Endpoint status updated to ${status}.`,
                    data: updated as IEndpoint,
                },
                200
            );
        } catch (error: unknown) {
            logger.error(
                'Unexpected error in EndpointController.updateEndpointStatus',
                error as Error
            );
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'UPDATE_STATUS_FAILED',
                        message: 'Failed to update endpoint status',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async updateEndpoint(c: AppContext): Promise<Response> {
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
            const { endpointId }: GetEndpointByIdInput = c.req.valid('param');
            const valid: UpdateEndpointInput = c.req.valid('json');

            const updated = await endpointService.updateEndpoint(
                endpointId,
                workspaceId.toString(),
                projectId.toString(),
                valid
            );

            return c.json<UpdateEndpointResponse>(
                {
                    success: true,
                    message: 'Endpoint updated successfully.',
                    data: updated as IEndpoint,
                },
                200
            );
        } catch (error: unknown) {
            logger.error(
                'Unexpected error in EndpointController.updateEndpoint',
                error as Error
            );
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'UPDATE_ENDPOINT_FAILED',
                        message: 'Failed to update endpoint',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async deleteEndpoint(c: AppContext): Promise<Response> {
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
            const { endpointId }: GetEndpointByIdInput = c.req.valid('param');

            const deleted = await endpointService.deleteEndpoint(
                endpointId,
                workspaceId.toString(),
                projectId.toString()
            );

            return c.json<DeleteEndpointResponse>(
                {
                    success: true,
                    message: 'Endpoint deleted successfully.',
                },
                200
            );
        } catch (error: unknown) {
            logger.error(
                'Unexpected error in EndpointController.deleteEndpoint',
                error as Error
            );
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'DELETE_ENDPOINT_FAILED',
                        message: 'Failed to delete endpoint',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }
}
