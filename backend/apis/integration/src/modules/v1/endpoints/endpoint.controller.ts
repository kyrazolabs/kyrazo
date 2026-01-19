import type {
    CreateEndpointInput,
    FilterEndpointInput,
    GetEndpointByIdInput,
    UpdateEndpointInput,
} from './endpoint.schema';
import type {
    CreateEndpointResponse,
    DeleteEndpointResponse,
    GetEndpointResponse,
    GetEndpointsResponse,
    GetEndpointSecretResponse,
    UpdateEndpointResponse,
} from './endpoint.types';

import type { AppContext } from '@/core/middlewares/auth.middleware';
import { endpointService } from './endpoint.service';
import { logger } from '@kyrazo/shared';
import { Types } from 'mongoose';

export class EndpointController {
    static async createEndpoint(c: AppContext) {
        try {
            // @ts-ignore
            const valid: CreateEndpointInput = c.req.valid('json');

            const workspaceId = c.workspace!.workspaceId;
            const projectId = c.project!.projectId;
            const userId = c.userId!;

            const endpoint = await endpointService.createEndpoint(
                valid,
                userId,
                workspaceId,
                projectId
            );

            return c.json<CreateEndpointResponse>(
                {
                    success: true,
                    message: 'Endpoint created successfully',
                    data: {
                        endpoint,
                    },
                },
                201
            );
        } catch (error) {
            logger.error('Failed to create endpoint:', error as Error);
            return c.json(
                {
                    success: false,
                    message: 'Failed to create endpoint',
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Unknown error',
                },
                500
            );
        }
    }

    static async getEndpoints(c: AppContext) {
        try {
            // @ts-ignore
            const {
                q,
                status,
                limit = 10,
                page = 1,
            }: FilterEndpointInput = c.req.valid('query');

            const workspaceId = c.workspace!.workspaceId;
            const projectId = c.project!.projectId;

            const query: any = {
                workspaceId: new Types.ObjectId(workspaceId),
                projectId: new Types.ObjectId(projectId),
            };

            if (q) {
                query.name = { $regex: q, $options: 'i' };
            }
            if (status) {
                query.status = status;
            }

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
        } catch (error) {
            logger.error('Failed to get endpoints:', error as Error);
            return c.json(
                {
                    success: false,
                    message: 'Failed to get endpoints',
                },
                500
            );
        }
    }

    static async getEndpoint(c: AppContext) {
        try {
            // @ts-ignore
            const { endpointId }: GetEndpointByIdInput = c.req.valid('param');
            const workspaceId = c.workspace!.workspaceId.toString();
            const projectId = c.project!.projectId.toString();

            const endpoint = await endpointService.getEndpointById(
                endpointId,
                workspaceId,
                projectId
            );

            return c.json<GetEndpointResponse>(
                {
                    success: true,
                    message: 'Endpoint fetched successfully',
                    data: endpoint,
                },
                200
            );
        } catch (error: any) {
            logger.error('Failed to get endpoint:', error as Error);
            if (error.message === 'Endpoint not found') {
                return c.json(
                    {
                        success: false,
                        message: 'Endpoint not found',
                    },
                    404
                );
            }
            return c.json(
                {
                    success: false,
                    message: 'Failed to get endpoint',
                },
                500
            );
        }
    }

    static async getEndpointSecret(c: AppContext) {
        try {
            // @ts-ignore
            const { endpointId }: GetEndpointByIdInput = c.req.valid('param');
            const workspaceId = c.workspace!.workspaceId.toString();
            const projectId = c.project!.projectId.toString();

            const secret = await endpointService.getEndpointSecret(
                endpointId,
                workspaceId,
                projectId
            );

            return c.json<GetEndpointSecretResponse>(
                {
                    success: true,
                    message: 'Endpoint secret fetched successfully',
                    data: secret,
                },
                200
            );
        } catch (error: any) {
            logger.error('Failed to get endpoint secret:', error as Error);
            if (
                error.message === 'Endpoint not found' ||
                error.message === 'Active secret not found'
            ) {
                return c.json(
                    {
                        success: false,
                        message: error.message,
                    },
                    404
                );
            }
            return c.json(
                {
                    success: false,
                    message: 'Failed to get endpoint secret',
                },
                500
            );
        }
    }

    static async updateEndpoint(c: AppContext) {
        try {
            // @ts-ignore
            const { endpointId }: GetEndpointByIdInput = c.req.valid('param');
            // @ts-ignore
            const data: UpdateEndpointInput = c.req.valid('json');

            const workspaceId = c.workspace!.workspaceId.toString();
            const projectId = c.project!.projectId.toString();

            const updated = await endpointService.updateEndpoint(
                endpointId,
                workspaceId,
                projectId,
                data
            );

            return c.json<UpdateEndpointResponse>(
                {
                    success: true,
                    message: 'Endpoint updated successfully',
                    data: updated,
                },
                200
            );
        } catch (error: any) {
            logger.error('Failed to update endpoint:', error as Error);
            if (error.message === 'Endpoint not found') {
                return c.json(
                    {
                        success: false,
                        message: 'Endpoint not found',
                    },
                    404
                );
            }
            return c.json(
                {
                    success: false,
                    message: 'Failed to update endpoint',
                },
                500
            );
        }
    }

    static async deleteEndpoint(c: AppContext) {
        try {
            // @ts-ignore
            const { endpointId }: GetEndpointByIdInput = c.req.valid('param');
            const workspaceId = c.workspace!.workspaceId.toString();
            const projectId = c.project!.projectId.toString();

            const deleted = await endpointService.deleteEndpoint(
                endpointId,
                workspaceId,
                projectId
            );

            return c.json<DeleteEndpointResponse>(
                {
                    success: true,
                    message: 'Endpoint deleted successfully',
                    data: deleted,
                },
                200
            );
        } catch (error: any) {
            logger.error('Failed to delete endpoint:', error as Error);
            if (error.message === 'Endpoint not found') {
                return c.json(
                    {
                        success: false,
                        message: 'Endpoint not found',
                    },
                    404
                );
            }
            return c.json(
                {
                    success: false,
                    message: 'Failed to delete endpoint',
                },
                500
            );
        }
    }
}
