import { AppContext } from '@/core/middlewares/auth.middleware';
import { logger, redisConfig } from '@/configs';
import { OverviewFilterInput, TargetQueryInput } from '@/core/utils/libs/zod';
import { IErrorResponse, Source, Target } from '@kyrazo/shared';
import { AnalyticsService } from './analytics.service';
import {
    IAnalyticsDispatchResponse,
    IAnalyticsIngestResponse,
} from './analytics.schema';

export class AnalyticsController {
    static async getDispatchUsage(c: AppContext): Promise<Response> {
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

            const { days }: OverviewFilterInput = c.req.valid('query');

            const last = days.replace(/\D/g, '');

            const {
                stats,
                deliveryTrends,
                topEventTypes,
                statusCodeDistribution,
            } = await AnalyticsService.getDispatchOverview(
                parseInt(last),
                workspaceId.toString(),
                projectId.toString()
            );

            // Fetch active targets count
            const activeTargets = await Target.countDocuments({
                workspaceId,
                projectId,
                enabled: true,
            });

            // Calculate success rate
            const total = Number(stats.total_deliveries) || 0;
            const successful = Number(stats.successful_deliveries) || 0;
            const successRate =
                total > 0
                    ? Math.round((successful / total) * 100 * 100) / 100
                    : 0; // Round to 2 decimal places

            return c.json<{
                success: boolean;
                data: IAnalyticsDispatchResponse;
            }>(
                {
                    success: true,
                    data: {
                        stats: {
                            ...stats,
                            active_targets: activeTargets,
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
                'Unexpected error in AnalyticsController.getDeliveryStats',
                error as Error
            );
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'GET_DELIVERY_STATS_FAILED',
                        message: 'Failed to get delivery statistics',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async getIngestUsage(c: AppContext): Promise<Response> {
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

            const { days }: OverviewFilterInput = c.req.valid('query');

            const last = days.replace(/\D/g, '');

            const {
                stats,
                receiveTrends,
                topSources,
                processStatusDistribution,
                failureTrends,
            } = await AnalyticsService.getIngestOverview(
                parseInt(last),
                workspaceId.toString(),
                projectId.toString()
            );

            const sources = await redisConfig.cache(
                `workspace:${workspaceId}:project:${projectId}:sources`,
                async () => {
                    return await Source.find({
                        workspaceId,
                        projectId,
                        type: 'receive',
                    });
                },
                60 * 2
            );

            // Calculate success rate
            const total = Number(stats.total_events) || 0;
            const successful = Number(stats.successful_events) || 0;
            const ingests = sources.length; // Use redis source count

            const successRate =
                total > 0
                    ? Math.round((successful / total) * 100 * 100) / 100
                    : 0; // Round to 2 decimal places

            return c.json<{
                success: boolean;
                data: IAnalyticsIngestResponse;
            }>(
                {
                    success: true,
                    data: {
                        stats: {
                            ...stats,
                            ingests: ingests, // Overwriting DB count with registered count
                            success_rate: successRate,
                        },
                        receiveTrends: receiveTrends,
                        topSources: topSources,
                        processStatusDistribution: processStatusDistribution,
                        failureTrends: failureTrends,
                    },
                },
                200
            );
        } catch (error: unknown) {
            logger.error(
                'Unexpected error in AnalyticsController.getIngestUsage',
                error as Error
            );
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'GET_PRECEST_STATS_FAILED',
                        message: 'Failed to get ingest statistics',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }

    static async getTargetOverview(c: AppContext): Promise<Response> {
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

            const { target }: TargetQueryInput = c.req.valid('param');
            const { days }: OverviewFilterInput = c.req.valid('query');

            const last = days.replace(/\D/g, '');

            const {
                stats,
                deliveryTrends,
                topEventTypes,
                statusCodeDistribution,
            } = await AnalyticsService.getTargetOverview(
                parseInt(last),
                workspaceId.toString(),
                target,
                projectId.toString()
            );

            // Calculate success rate
            const total = Number(stats.total_deliveries) || 0;
            const successful = Number(stats.successful_deliveries) || 0;
            const successRate =
                total > 0
                    ? Math.round((successful / total) * 100 * 100) / 100
                    : 0; // Round to 2 decimal places

            return c.json<{
                success: boolean;
                data: IAnalyticsDispatchResponse;
            }>(
                {
                    success: true,
                    data: {
                        stats: {
                            ...stats,
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
                'Unexpected error in AnalyticsController.getTargetStats',
                error as Error
            );
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'GET_PRECEST_STATS_FAILED',
                        message: 'Failed to get ingest statistics',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }
}
