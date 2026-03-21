import { AppContext } from '@/core/middlewares/auth.middleware';
import { redisConfig } from '@/configs';
import { OverviewFilterInput, TargetQueryInput } from '@/core/utils/libs/zod';
import { IErrorResponse, logger, Source, Target, unprefixId } from '@kyrazo/shared';
import { AnalyticsService } from './analytics.service';
import { IAnalyticsDispatchResponse, IAnalyticsIngestResponse } from './analytics.schema';
import { Types } from 'mongoose';

export class AnalyticsController {
    static async getDispatchUsage(c: AppContext): Promise<Response> {
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
            const { days }: OverviewFilterInput = c.req.valid('query');

            const last = days.replace(/\D/g, '');

            const { stats, deliveryTrends, topEventTypes, statusCodeDistribution } =
                await AnalyticsService.getDispatchOverview(
                    parseInt(last),
                    workspaceId.toString(),
                    namespaceId.toString()
                );

            // Fetch active targets count
            const activeTargets = await Target.countDocuments({
                workspaceId: new Types.ObjectId(unprefixId(workspaceId.toString())),
                namespaceId: new Types.ObjectId(unprefixId(namespaceId.toString())),
                enabled: true,
            });

            // Calculate success rate
            const total = Number(stats.total_deliveries) || 0;
            const successful = Number(stats.successful_deliveries) || 0;
            const successRate = total > 0 ? Math.round((successful / total) * 100 * 100) / 100 : 0; // Round to 2 decimal places

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
        } catch (error: any) {
            logger.error('Unexpected error in AnalyticsController.getDeliveryStats', error);
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
            const { days }: OverviewFilterInput = c.req.valid('query');

            const last = days.replace(/\D/g, '');

            const { stats, receiveTrends, topSources, processStatusDistribution, failureTrends } =
                await AnalyticsService.getIngestOverview(
                    parseInt(last),
                    workspaceId.toString(),
                    namespaceId.toString()
                );

            const sources = await redisConfig.cache(
                `workspace:${unprefixId(workspaceId.toString())}:namespace:${unprefixId(namespaceId.toString())}:sources`,
                async () => {
                    return await Source.find({
                        workspaceId: new Types.ObjectId(unprefixId(workspaceId.toString())),
                        namespaceId: new Types.ObjectId(unprefixId(namespaceId.toString())),
                        type: 'receive',
                    });
                },
                60 * 2
            );

            // Calculate success rate
            const total = Number(stats.total_events) || 0;
            const successful = Number(stats.successful_events) || 0;
            const ingests = sources.length; // Use redis source count

            const successRate = total > 0 ? Math.round((successful / total) * 100 * 100) / 100 : 0; // Round to 2 decimal places

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
        } catch (error: any) {
            logger.error('Unexpected error in AnalyticsController.getIngestUsage', error);
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'GET_INGEST_STATS_FAILED',
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
            const { targetId }: TargetQueryInput = c.req.valid('param');
            // @ts-ignore
            const { days }: OverviewFilterInput = c.req.valid('query');

            const last = days.replace(/\D/g, '');

            const { stats, deliveryTrends, topEventTypes, statusCodeDistribution } =
                await AnalyticsService.getTargetOverview(
                    parseInt(last),
                    workspaceId.toString(),
                    targetId,
                    namespaceId.toString()
                );

            // Calculate success rate
            const total = Number(stats.total_deliveries) || 0;
            const successful = Number(stats.successful_deliveries) || 0;
            const successRate = total > 0 ? Math.round((successful / total) * 100 * 100) / 100 : 0; // Round to 2 decimal places

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
        } catch (error: any) {
            logger.error('Unexpected error in AnalyticsController.getTargetStats', error);
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
