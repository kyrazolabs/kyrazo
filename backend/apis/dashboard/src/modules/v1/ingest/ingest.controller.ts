import { AppContext } from '@/core/middlewares/auth.middleware';
import { IErrorResponse, IngestRepo, logger } from '@kyrazo/shared';
import { GetIngestsBySourceIdInput, IFilterIngest } from './ingest.schema';
import {
    IGetIngestEventResponse,
    IGetIngestEventsResponse,
} from './ingest.type';

export class IngestController {
    static async getIngestEvents(c: AppContext): Promise<Response> {
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
                status,
                limit = 10,
                page = 1,
            }: IFilterIngest = c.req.valid('query');

            const { data: deliveries, total } =
                await IngestRepo.getIngestEvents(
                    workspaceId.toString(),
                    projectId.toString(),
                    status,
                    limit,
                    page
                );

            return c.json<IGetIngestEventsResponse>(
                {
                    success: true,
                    pagination: {
                        total,
                        page,
                        limit,
                        pages: Math.ceil(total / limit),
                    },
                    data: deliveries,
                },
                200
            );
        } catch (error: unknown) {
            logger.error(
                'Unexpected error in IngestController.getDeliveries',
                error as Error
            );
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'GET_DELIVERIES_FAILED',
                        message: 'Failed to get deliveries',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async getIngestEventsBySource(c: AppContext): Promise<Response> {
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

            const { sourceId }: GetIngestsBySourceIdInput =
                c.req.valid('param');
            const { limit = 10, page = 1 }: IFilterIngest =
                c.req.valid('query');

            const { data: deliveries, total } =
                await IngestRepo.getReceivedEventsBySource(
                    sourceId,
                    workspaceId.toString(),
                    projectId.toString(),
                    limit,
                    page
                );

            return c.json<IGetIngestEventsResponse>(
                {
                    success: true,
                    pagination: {
                        total,
                        page,
                        limit,
                        pages: Math.ceil(total / limit),
                    },
                    data: deliveries,
                },
                200
            );
        } catch (error: unknown) {
            logger.error(
                'Unexpected error in IngestController.getDeliveriesBySource',
                error as Error
            );
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'GET_RECEIVED_EVENTS_FAILED',
                        message: 'Failed to get received events',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async getIngestEventById(c: AppContext): Promise<Response> {
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
            const { eventId } = c.req.valid('param');

            const result = await IngestRepo.getIngestEventById(
                eventId,
                workspaceId.toString(),
                projectId.toString()
            );
            const delivery = result[0] || null;

            return c.json<IGetIngestEventResponse>(
                {
                    success: true,
                    data: delivery,
                },
                200
            );
        } catch (error: unknown) {
            logger.error(
                'Unexpected error in IngestController.getDeliveryById',
                error as Error
            );
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'GET_DELIVERY_FAILED',
                        message: 'Failed to get delivery',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }
}
