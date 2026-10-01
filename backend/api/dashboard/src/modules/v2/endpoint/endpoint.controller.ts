import { AppContext } from '@/core/middlewares/auth.middleware';
import { IErrorResponse, logger } from '@kyrazo/shared';
import {
    CreateEndpointResponse,
    DeleteEndpointResponse,
    GetEndpointResponse,
    GetEndpointsResponse,
    UpdateEndpointResponse,
} from './endpoint.types';
import {
    CreateEndpointDto,
    UpdateEndpointDto,
} from './endpoint.schema';
import { endpointService } from './endpoint.service';

export class EndpointController {
    static async createEndpoint(c: AppContext): Promise<Response> {
        try {
            const userId = c.user?.userId;
            const workspaceId = c.workspace?.workspaceId;
            const namespaceId = c.namespace?.namespaceId;

            if (!userId || !workspaceId || !namespaceId) {
                return c.json<IErrorResponse>({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Unauthorized access',
                        requestId: c.get('requestId'),
                    },
                }, 401);
            }

            const valid = c.req.valid('json') as CreateEndpointDto;
            const saved = await endpointService.createEndpoint(
                valid,
                userId.toString(),
                workspaceId.toString(),
                namespaceId.toString()
            );

            return c.json<CreateEndpointResponse>({
                success: true,
                message: 'Endpoint created successfully',
                data: saved,
            }, 201);
        } catch (error: any) {
            logger.error('Error in EndpointController.createEndpoint', error);
            return c.json<IErrorResponse>({
                success: false,
                error: {
                    code: 'CREATE_ENDPOINT_FAILED',
                    message: error.message || 'Failed to create endpoint',
                    requestId: c.get('requestId'),
                },
            }, 500);
        }
    }

    static async getEndpoints(c: AppContext): Promise<Response> {
        try {
            const workspaceId = c.workspace?.workspaceId;
            const namespaceId = c.namespace?.namespaceId;

            if (!workspaceId || !namespaceId) {
                return c.json<IErrorResponse>({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Unauthorized access',
                        requestId: c.get('requestId'),
                    },
                }, 401);
            }

            const q = c.req.query('q');
            const status = c.req.query('status');
            const limit = parseInt(c.req.query('limit') || '10');
            const page = parseInt(c.req.query('page') || '1');

            const { endpoints, total } = await endpointService.getEndpoints(
                workspaceId.toString(), 
                namespaceId.toString(), 
                {
                    q,
                    status,
                    limit,
                    page,
                }
            );

            return c.json<GetEndpointsResponse>({
                success: true,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit),
                },
                data: endpoints,
            }, 200);
        } catch (error: any) {
            logger.error('Error in EndpointController.getEndpoints', error);
            return c.json<IErrorResponse>({
                success: false,
                error: {
                    code: 'GET_ENDPOINTS_FAILED',
                    message: 'Failed to fetch endpoints',
                    requestId: c.get('requestId'),
                },
            }, 500);
        }
    }

    static async getEndpoint(c: AppContext): Promise<Response> {
        try {
            const workspaceId = c.workspace?.workspaceId;
            const namespaceId = c.namespace?.namespaceId;
            const endpointId = c.req.param('endpointId');

            if (!workspaceId || !namespaceId || !endpointId) {
                return c.json<IErrorResponse>({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Unauthorized access',
                        requestId: c.get('requestId'),
                    },
                }, 401);
            }

            const endpoint = await endpointService.getEndpointById(
                endpointId.toString(), 
                workspaceId.toString(), 
                namespaceId.toString()
            );
            return c.json<GetEndpointResponse>({
                success: true,
                message: 'Endpoint fetched successfully',
                data: endpoint,
            }, 200);
        } catch (error: any) {
            logger.error('Error in EndpointController.getEndpoint', error);
            return c.json<IErrorResponse>({
                success: false,
                error: {
                    code: 'GET_ENDPOINT_FAILED',
                    message: error.message || 'Failed to fetch endpoint',
                    requestId: c.get('requestId'),
                },
            }, 500);
        }
    }

    static async getEndpointSecret(c: AppContext): Promise<Response> {
        try {
            const workspaceId = c.workspace?.workspaceId;
            const namespaceId = c.namespace?.namespaceId;
            const endpointId = c.req.param('endpointId');

            if (!workspaceId || !namespaceId || !endpointId) {
                return c.json<IErrorResponse>({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Unauthorized access',
                        requestId: c.get('requestId'),
                    },
                }, 401);
            }

            const secret = await endpointService.getEndpointSecret(
                endpointId.toString(), 
                workspaceId.toString(), 
                namespaceId.toString()
            );
            return c.json({
                success: true,
                message: 'Secret fetched successfully',
                data: secret,
            }, 200);
        } catch (error: any) {
            logger.error('Error in EndpointController.getEndpointSecret', error);
            return c.json<IErrorResponse>({
                success: false,
                error: {
                    code: 'GET_SECRET_FAILED',
                    message: error.message || 'Failed to fetch secret',
                    requestId: c.get('requestId'),
                },
            }, 500);
        }
    }

    static async updateEndpoint(c: AppContext): Promise<Response> {
        try {
            const userId = c.user?.userId;
            const workspaceId = c.workspace?.workspaceId;
            const namespaceId = c.namespace?.namespaceId;
            const endpointId = c.req.param('endpointId');

            if (!userId || !workspaceId || !namespaceId || !endpointId) {
                return c.json<IErrorResponse>({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Unauthorized access',
                        requestId: c.get('requestId'),
                    },
                }, 401);
            }

            const valid = c.req.valid('json') as UpdateEndpointDto;
            const updated = await endpointService.updateEndpoint(
                endpointId.toString(),
                workspaceId.toString(),
                namespaceId.toString(),
                valid,
                userId.toString()
            );

            return c.json<UpdateEndpointResponse>({
                success: true,
                message: 'Endpoint updated successfully',
                data: updated,
            }, 200);
        } catch (error: any) {
            logger.error('Error in EndpointController.updateEndpoint', error);
            return c.json<IErrorResponse>({
                success: false,
                error: {
                    code: 'UPDATE_ENDPOINT_FAILED',
                    message: error.message || 'Failed to update endpoint',
                    requestId: c.get('requestId'),
                },
            }, 500);
        }
    }

    static async deleteEndpoint(c: AppContext): Promise<Response> {
        try {
            const workspaceId = c.workspace?.workspaceId;
            const namespaceId = c.namespace?.namespaceId;
            const endpointId = c.req.param('endpointId');

            if (!workspaceId || !namespaceId || !endpointId) {
                return c.json<IErrorResponse>({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Unauthorized access',
                        requestId: c.get('requestId'),
                    },
                }, 401);
            }

            await endpointService.deleteEndpoint(
                endpointId.toString(), 
                workspaceId.toString(), 
                namespaceId.toString()
            );
            return c.json<DeleteEndpointResponse>({
                success: true,
                message: 'Endpoint deleted successfully',
            }, 200);
        } catch (error: any) {
            logger.error('Error in EndpointController.deleteEndpoint', error);
            return c.json<IErrorResponse>({
                success: false,
                error: {
                    code: 'DELETE_ENDPOINT_FAILED',
                    message: error.message || 'Failed to delete endpoint',
                    requestId: c.get('requestId'),
                },
            }, 500);
        }
    }
}
