import { AppContext } from '@/core/middlewares/auth.middleware';
import { logger } from '@/configs';
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
    IGetReceivedEventsResponse,
    IGetTargetsResponse,
    IngestRepo,
} from '@kyrazo/shared';

export class DeliveryController {
    static async getDeliveriesBySource(c: AppContext): Promise<Response> {
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

            const { sourceId }: GetDeliveriesBySourceIdInput =
                c.req.valid('param');
            const { limit = 10, page = 1 }: IFilterDeliveryBySource =
                c.req.valid('query');

            const { data: deliveries, total } =
                await DeliveryRepo.getDeliveriesBySource(
                    sourceId,
                    workspaceId.toString(),
                    projectId.toString(),
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
            }: IFilterDelivery = c.req.valid('query');

            const { data: deliveries, total } =
                await DeliveryRepo.getDeliveries(
                    workspaceId.toString(),
                    projectId.toString(),
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
                    data: deliveries,
                },
                200
            );
        } catch (error: unknown) {
            logger.error(
                'Unexpected error in DeliveryController.getDeliveries',
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

    static async getTargets(c: AppContext): Promise<Response> {
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

            const { limit = 10, page = 1 }: IFilterDelivery =
                c.req.valid('query');

            const { data: deliveries, total } = await DeliveryRepo.getTargets(
                workspaceId.toString(),
                projectId.toString(),
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
            logger.error(
                'Unexpected error in DeliveryController.getTargets',
                error as Error
            );
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
            const { limit = 10, page = 1 }: IFilterDelivery =
                c.req.valid('query');
            const { target }: GetDeliveriesByTargetInput = c.req.valid('param');

            const { data: deliveries, total } =
                await DeliveryRepo.getDeliveriesByTarget(
                    target,
                    workspaceId.toString(),
                    projectId.toString(),
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
                    data: deliveries,
                },
                200
            );
        } catch (error: unknown) {
            logger.error(
                'Unexpected error in DeliveryController.getByTarget',
                error as Error
            );
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
            const { deliveryId }: GetDeliveryByIdInput = c.req.valid('param');

            const result = await DeliveryRepo.getDeliveryById(
                deliveryId,
                workspaceId.toString(),
                projectId.toString()
            );
            const delivery = result[0] || null;

            return c.json<IGetDeliveryResponse>(
                {
                    success: true,
                    data: delivery,
                },
                200
            );
        } catch (error: unknown) {
            logger.error(
                'Unexpected error in DeliveryController.getDeliveryById',
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

    static async getDeliveryStatsByTarget(c: AppContext): Promise<Response> {
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

            const { target }: GetDeliveriesByTargetInput = c.req.valid('param');
            const { days }: OverviewFilterInput = c.req.valid('query');

            const last = days.replace(/\D/g, '');

            const {
                stats,
                deliveryTrends,
                topEventTypes,
                statusCodeDistribution,
            } = await DeliveryRepo.getDeliveriesOverviewByTarget(
                parseInt(last),
                target,
                workspaceId.toString(),
                projectId.toString()
            );

            // Calculate success rate
            const total = Number(stats.total_deliveries) || 0;
            const successful = Number(stats.successful_deliveries) || 0;
            const failed = Number(stats.failed_deliveries) || 0;
            const pending = Number(stats.pending_deliveries) || 0;
            const average = Number(stats.average_delivery_time) || null;
            const successRate =
                total > 0
                    ? Math.round((successful / total) * 100 * 100) / 100
                    : 0; // Round to 2 decimal places

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

            return c.json<IGetReceivedEventsResponse>(
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
                'Unexpected error in DeliveryController.getDeliveries',
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

    static async getReceivedEventsBySource(c: AppContext): Promise<Response> {
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

            const { sourceId }: GetDeliveriesBySourceIdInput =
                c.req.valid('param');
            const { limit = 10, page = 1 }: IFilterDeliveryBySource =
                c.req.valid('query');

            const { data: deliveries, total } =
                await IngestRepo.getReceivedEventsBySource(
                    sourceId,
                    workspaceId.toString(),
                    projectId.toString(),
                    limit,
                    page
                );

            return c.json<IGetReceivedEventsResponse>(
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
                'Unexpected error in DeliveryController.getDeliveryById',
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
