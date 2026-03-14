import { AppContext } from '@/core/middlewares/auth.middleware';
import {
    GetDeliveryByIdInput,
    GetDeliveriesBySourceIdInput,
    IFilterDelivery,
    IFilterDeliveryBySource,
    GetDeliveriesByTargetInput,
    OverviewFilterInput,
    IFilterIngest,
} from './delivery.schema';
import {
    DeliveryRepo,
    IErrorResponse,
    IGetDeliveriesResponse,
    IGetDeliveryResponse,
    IGetIngestEventResponse,
    IGetIngestEventsResponse,
    IGetTargetsResponse,
    IngestRepo,
    logger,
    secretCrypto,
    transformWithId,
} from '@kyrazo/shared';

export class DeliveryController {
    static async getDeliveriesBySource(c: AppContext): Promise<Response> {
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
            const { sourceId }: GetDeliveriesBySourceIdInput = c.req.valid('param');
            // @ts-ignore
            const { limit = 10, page = 1 }: IFilterDeliveryBySource = c.req.valid('query');

            const { data: deliveries, total } = await DeliveryRepo.getDeliveriesBySource(
                sourceId,
                workspaceId.toString(),
                namespaceId.toString(),
                limit,
                page
            );

            return c.json<IGetDeliveriesResponse>(
                {
                    success: true,
                    pagination: {
                        total,
                        page,
                        limit,
                        pages: Math.ceil(total / limit),
                    },
                    data: deliveries.map(DeliveryController.decryptDelivery),
                },
                200
            );
        } catch (error: unknown) {
            logger.error(
                'Unexpected error in DeliveryController.getDeliveriesBySource',
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

    static async getDeliveries(c: AppContext): Promise<Response> {
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
            const { status, limit = 10, page = 1 }: IFilterDelivery = c.req.valid('query');

            const { data: deliveries, total } = await DeliveryRepo.getDeliveries(
                workspaceId.toString(),
                namespaceId.toString(),
                status,
                limit,
                page
            );

            return c.json<IGetDeliveriesResponse>(
                {
                    success: true,
                    pagination: {
                        total,
                        page,
                        limit,
                        pages: Math.ceil(total / limit),
                    },
                    data: deliveries.map(DeliveryController.decryptDelivery),
                },
                200
            );
        } catch (error: unknown) {
            logger.error('Unexpected error in DeliveryController.getDeliveries', error as Error);
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

            const { limit = 10, page = 1 }: IFilterDelivery = c.req.valid('query');

            const { data: deliveries, total } = await DeliveryRepo.getTargets(
                workspaceId.toString(),
                namespaceId.toString(),
                limit,
                page
            );

            return c.json<IGetTargetsResponse>(
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
            logger.error('Unexpected error in DeliveryController.getTargets', error as Error);
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

    static async getDeliveriesByTarget(c: AppContext): Promise<Response> {
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
            const { limit = 10, page = 1 }: IFilterDelivery = c.req.valid('query');
            // @ts-ignore
            const { target }: GetDeliveriesByTargetInput = c.req.valid('param');

            const { data: deliveries, total } = await DeliveryRepo.getDeliveriesByTarget(
                target,
                workspaceId.toString(),
                namespaceId.toString(),
                limit,
                page
            );

            return c.json<IGetDeliveriesResponse>(
                {
                    success: true,
                    pagination: {
                        total,
                        page,
                        limit,
                        pages: Math.ceil(total / limit),
                    },
                    data: deliveries.map(DeliveryController.decryptDelivery),
                },
                200
            );
        } catch (error: unknown) {
            logger.error('Unexpected error in DeliveryController.getByTarget', error as Error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'GET_TARGET_DELIVERIES_FAILED',
                        message: 'Failed to get target deliveries',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async getDeliveryById(c: AppContext): Promise<Response> {
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
            const { deliveryId }: GetDeliveryByIdInput = c.req.valid('param');

            const result = await DeliveryRepo.getDeliveryById(
                deliveryId,
                workspaceId.toString(),
                namespaceId.toString()
            );
            const delivery = result[0] || null;

            return c.json<IGetDeliveryResponse>(
                {
                    success: true,
                    data: DeliveryController.decryptDelivery(delivery),
                },
                200
            );
        } catch (error: unknown) {
            logger.error('Unexpected error in DeliveryController.getDeliveryById', error as Error);
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

    static async getDeliveryStatsByTarget(c: AppContext): Promise<Response> {
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
            const { target }: GetDeliveriesByTargetInput = c.req.valid('param');
            // @ts-ignore
            const { days }: OverviewFilterInput = c.req.valid('query');

            const last = days.replace(/\D/g, '');

            const { stats, deliveryTrends, topEventTypes, statusCodeDistribution } =
                await DeliveryRepo.getDeliveriesOverviewByTarget(
                    parseInt(last),
                    target,
                    workspaceId.toString(),
                    namespaceId.toString()
                );

            // Calculate success rate
            const total = Number(stats.total_deliveries) || 0;
            const successful = Number(stats.successful_deliveries) || 0;
            const failed = Number(stats.failed_deliveries) || 0;
            const pending = Number(stats.pending_deliveries) || 0;
            const average = Number(stats.average_delivery_time) || null;
            const successRate = total > 0 ? Math.round((successful / total) * 100 * 100) / 100 : 0; // Round to 2 decimal places

            return c.json(
                {
                    success: true,
                    data: {
                        stats: {
                            total_deliveries: total,
                            successful_deliveries: successful,
                            failed_deliveries: failed,
                            pending_deliveries: pending,
                            average_delivery_time: average,
                            success_rate: successRate,
                        },
                        deliveryTrends: deliveryTrends,
                        topEventTypes: topEventTypes,
                        statusCodeDistribution: statusCodeDistribution,
                    },
                },
                200
            );
        } catch (error: unknown) {
            logger.error(
                'Unexpected error in DeliveryController.getDeliveryStatsByTarget',
                error as Error
            );
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'GET_DELIVERY_STATS_FAILED',
                        message: 'Failed to get delivery statistics',
                        details: error,
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

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
                    data: deliveries,
                },
                200
            );
        } catch (error: unknown) {
            logger.error('Unexpected error in DeliveryController.getDeliveries', error as Error);
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

    static async getReceivedEventsBySource(c: AppContext): Promise<Response> {
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
            const { sourceId }: GetDeliveriesBySourceIdInput = c.req.valid('param');
            // @ts-ignore
            const { limit = 10, page = 1 }: IFilterDeliveryBySource = c.req.valid('query');

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
                    data: deliveries,
                },
                200
            );
        } catch (error: unknown) {
            logger.error(
                'Unexpected error in DeliveryController.getDeliveriesBySource',
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
                    data: delivery,
                },
                200
            );
        } catch (error: unknown) {
            logger.error('Unexpected error in DeliveryController.getDeliveryById', error as Error);
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

    private static decryptDelivery(delivery: any) {
        if (!delivery) return delivery;
        const namespaceId = delivery.namespace_id;
        if (!namespaceId) return delivery;

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
                ...delivery,
                request_body: tryDecrypt(delivery.request_body),
                request_header: tryDecrypt(delivery.request_header),
                response_body: tryDecrypt(delivery.response_body),
                response_header: tryDecrypt(delivery.response_header),
            },
            'delivery'
        );
    }
}
