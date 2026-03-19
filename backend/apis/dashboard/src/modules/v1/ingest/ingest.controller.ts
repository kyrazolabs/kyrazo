import { AppContext } from '@/core/middlewares/auth.middleware';
import { IErrorResponse, IngestRepo, logger, secretCrypto, transformWithId } from '@kyrazo/shared';
import { GetIngestsBySourceIdInput, IFilterIngest } from './ingest.schema';
import { IGetIngestEventResponse, IGetIngestEventsResponse } from './ingest.type';

export class IngestController {
    static async getIngestEvents(c: AppContext): Promise<Response> {
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
            const { status, limit = 10, page = 1 }: IFilterIngest = c.req.valid('query');

            const { data: deliveries, total } = await IngestRepo.getIngestEvents(
                workspaceId.toString(),
                namespaceId.toString(),
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
                    data: deliveries.map(IngestController.decryptIngestEvent),
                },
                200
            );
        } catch (error: any) {
            logger.error('Unexpected error in IngestController.getDeliveries', error);
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
            const { sourceId }: GetIngestsBySourceIdInput = c.req.valid('param');
            // @ts-ignore
            const { limit = 10, page = 1 }: IFilterIngest = c.req.valid('query');

            const { data: deliveries, total } = await IngestRepo.getReceivedEventsBySource(
                sourceId,
                workspaceId.toString(),
                namespaceId.toString(),
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
                    data: deliveries.map(IngestController.decryptIngestEvent),
                },
                200
            );
        } catch (error: any) {
            logger.error('Unexpected error in IngestController.getDeliveriesBySource', error);
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
            const { eventId } = c.req.valid('param');

            const result = await IngestRepo.getIngestEventById(
                eventId,
                workspaceId.toString(),
                namespaceId.toString()
            );
            const delivery = result[0] || null;

            return c.json<IGetIngestEventResponse>(
                {
                    success: true,
                    data: IngestController.decryptIngestEvent(delivery),
                },
                200
            );
        } catch (error: any) {
            logger.error('Unexpected error in IngestController.getDeliveryById', error);
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

    private static decryptIngestEvent(event: any) {
        if (!event) return event;
        const namespaceId = event.namespace_id;
        if (!namespaceId) return event;

        const tryDecrypt = (field: string) => {
            if (!field || typeof field !== 'string' || !field.includes(':')) return field;
            const [iv, encrypted] = field.split(':');
            if (!iv || !encrypted) return field;
            try {
                return secretCrypto.decrypt(encrypted, iv, namespaceId);
            } catch (e) {
                return field;
            }
        };

        return transformWithId(
            {
                ...event,
                headers: tryDecrypt(event.headers),
                body: tryDecrypt(event.body),
            },
            'event'
        );
    }
}
