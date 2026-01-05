import {
    analyticsDispatchDay,
    analyticsIngestDay,
    logger,
    postgresConfig,
} from '@kyrazo/shared';
import { and, desc, eq, gte, sql } from 'drizzle-orm';

export class AnalyticsRepo {
    private static getClient() {
        return postgresConfig.getDrizzle();
    }

    static async getDispatchOverview(
        days: number = 7,
        workspaceId: string,
        projectId: string
    ) {
        try {
            // Cast to any to avoid "Type mismatch" between dashboard's drizzle-orm and shared's drizzle-orm
            const db = this.getClient() as any;
            const dateThreshold = new Date();
            dateThreshold.setDate(dateThreshold.getDate() - days);

            // Base where clause
            const whereClause = and(
                eq(analyticsDispatchDay.projectId as any, projectId),
                gte(
                    analyticsDispatchDay.bucketDay as any,
                    dateThreshold.toISOString()
                )
            );

            // 1. Overall Stats
            const statsPromise = db
                .select({
                    total_targets: sql<number>`count(distinct ${analyticsDispatchDay.targetId})`,
                    total_deliveries: sql<number>`sum(${analyticsDispatchDay.totalDeliveries})`,
                    successful_deliveries: sql<number>`sum(${analyticsDispatchDay.successfulDeliveries})`,
                    failed_deliveries: sql<number>`sum(${analyticsDispatchDay.failedDeliveries})`,
                    pending_deliveries: sql<number>`sum(${analyticsDispatchDay.pendingDeliveries})`,
                    // Weighted average for avg_delivery_time
                    weighted_time_sum: sql<number>`sum(${analyticsDispatchDay.avgDeliveryTimeMs} * ${analyticsDispatchDay.totalDeliveries})`,
                })
                .from(analyticsDispatchDay)
                .where(whereClause);

            // 2. Delivery Trends (grouped by day)
            const trendsPromise = db
                .select({
                    day: analyticsDispatchDay.bucketDay,
                    successful: sql<number>`sum(${analyticsDispatchDay.successfulDeliveries})`,
                    failed: sql<number>`sum(${analyticsDispatchDay.failedDeliveries})`,
                })
                .from(analyticsDispatchDay)
                .where(whereClause)
                .groupBy(analyticsDispatchDay.bucketDay)
                .orderBy(desc(analyticsDispatchDay.bucketDay as any));

            // 3. Top Event Types
            const topEventsPromise = db
                .select({
                    event_type: analyticsDispatchDay.eventType,
                    total: sql<number>`sum(${analyticsDispatchDay.totalDeliveries})`,
                })
                .from(analyticsDispatchDay)
                .where(whereClause)
                .groupBy(analyticsDispatchDay.eventType)
                .orderBy(
                    desc(sql`sum(${analyticsDispatchDay.totalDeliveries})`)
                )
                .limit(10);

            // 4. Status Code Distribution
            const statusCodePromise = db
                .select({
                    response_code: analyticsDispatchDay.responseCode,
                    total: sql<number>`sum(${analyticsDispatchDay.totalDeliveries})`,
                })
                .from(analyticsDispatchDay)
                .where(
                    and(
                        whereClause,
                        sql`${analyticsDispatchDay.responseCode} is not null`
                    )
                )
                .groupBy(analyticsDispatchDay.responseCode)
                .orderBy(
                    desc(sql`sum(${analyticsDispatchDay.totalDeliveries})`)
                );

            const [statsRes, trendsRes, topEventsRes, statusCodeRes] =
                await Promise.all([
                    statsPromise,
                    trendsPromise,
                    topEventsPromise,
                    statusCodePromise,
                ]);

            const stats = statsRes[0];

            // Calculate simple average from weighted sum
            const avgTime =
                Number(stats.total_deliveries) > 0
                    ? Number(stats.weighted_time_sum) /
                      Number(stats.total_deliveries)
                    : null;

            return {
                stats: {
                    total_targets: Number(stats.total_targets || 0),
                    total_deliveries: Number(stats.total_deliveries || 0),
                    successful_deliveries: Number(
                        stats.successful_deliveries || 0
                    ),
                    failed_deliveries: Number(stats.failed_deliveries || 0),
                    pending_deliveries: Number(stats.pending_deliveries || 0),
                    average_delivery_time: avgTime ? Math.round(avgTime) : null,
                },
                deliveryTrends: trendsRes.map((t: any) => {
                    const dayStr =
                        t.day instanceof Date
                            ? t.day.toISOString().split('T')[0]
                            : typeof t.day === 'string'
                              ? t.day.substring(0, 10)
                              : String(t.day);
                    return {
                        day: dayStr,
                        target: '', // Placeholder to match interface if needed
                        successful: Number(t.successful),
                        failed: Number(t.failed),
                    };
                }),
                topEventTypes: topEventsRes.map((e: any) => ({
                    target: '', // Placeholder
                    event_type: e.event_type || 'unknown',
                    total: Number(e.total),
                })),
                statusCodeDistribution: statusCodeRes.map((s: any) => ({
                    target: '', // Placeholder
                    response_code: s.response_code || 0,
                    total: Number(s.total),
                })),
            };
        } catch (error) {
            logger.error('Failed to get dispatch overview', error as Error);
            throw error;
        }
    }

    static async getTargetOverview(
        days: number = 7,
        workspaceId: string,
        targetId: string,
        projectId: string
    ) {
        try {
            // Cast to any to avoid "Type mismatch" between dashboard's drizzle-orm and shared's drizzle-orm
            const db = this.getClient() as any;
            const dateThreshold = new Date();
            dateThreshold.setDate(dateThreshold.getDate() - days);

            // Base where clause
            const whereClause = and(
                eq(analyticsDispatchDay.projectId as any, projectId),
                eq(analyticsDispatchDay.targetId as any, targetId),
                gte(
                    analyticsDispatchDay.bucketDay as any,
                    dateThreshold.toISOString()
                )
            );

            // 1. Overall Stats
            const statsPromise = db
                .select({
                    total_targets: sql<number>`count(distinct ${analyticsDispatchDay.targetId})`,
                    total_deliveries: sql<number>`sum(${analyticsDispatchDay.totalDeliveries})`,
                    successful_deliveries: sql<number>`sum(${analyticsDispatchDay.successfulDeliveries})`,
                    failed_deliveries: sql<number>`sum(${analyticsDispatchDay.failedDeliveries})`,
                    pending_deliveries: sql<number>`sum(${analyticsDispatchDay.pendingDeliveries})`,
                    // Weighted average for avg_delivery_time
                    weighted_time_sum: sql<number>`sum(${analyticsDispatchDay.avgDeliveryTimeMs} * ${analyticsDispatchDay.totalDeliveries})`,
                })
                .from(analyticsDispatchDay)
                .where(whereClause);

            // 2. Delivery Trends (grouped by day)
            const trendsPromise = db
                .select({
                    day: analyticsDispatchDay.bucketDay,
                    successful: sql<number>`sum(${analyticsDispatchDay.successfulDeliveries})`,
                    failed: sql<number>`sum(${analyticsDispatchDay.failedDeliveries})`,
                })
                .from(analyticsDispatchDay)
                .where(whereClause)
                .groupBy(analyticsDispatchDay.bucketDay)
                .orderBy(desc(analyticsDispatchDay.bucketDay as any));

            // 3. Top Event Types
            const topEventsPromise = db
                .select({
                    event_type: analyticsDispatchDay.eventType,
                    total: sql<number>`sum(${analyticsDispatchDay.totalDeliveries})`,
                })
                .from(analyticsDispatchDay)
                .where(whereClause)
                .groupBy(analyticsDispatchDay.eventType)
                .orderBy(
                    desc(sql`sum(${analyticsDispatchDay.totalDeliveries})`)
                )
                .limit(10);

            // 4. Status Code Distribution
            const statusCodePromise = db
                .select({
                    response_code: analyticsDispatchDay.responseCode,
                    total: sql<number>`sum(${analyticsDispatchDay.totalDeliveries})`,
                })
                .from(analyticsDispatchDay)
                .where(
                    and(
                        whereClause,
                        sql`${analyticsDispatchDay.responseCode} is not null`
                    )
                )
                .groupBy(analyticsDispatchDay.responseCode)
                .orderBy(
                    desc(sql`sum(${analyticsDispatchDay.totalDeliveries})`)
                );

            const [statsRes, trendsRes, topEventsRes, statusCodeRes] =
                await Promise.all([
                    statsPromise,
                    trendsPromise,
                    topEventsPromise,
                    statusCodePromise,
                ]);

            const stats = statsRes[0];

            // Calculate simple average from weighted sum
            const avgTime =
                Number(stats.total_deliveries) > 0
                    ? Number(stats.weighted_time_sum) /
                      Number(stats.total_deliveries)
                    : null;

            return {
                stats: {
                    total_targets: Number(stats.total_targets || 0),
                    total_deliveries: Number(stats.total_deliveries || 0),
                    successful_deliveries: Number(
                        stats.successful_deliveries || 0
                    ),
                    failed_deliveries: Number(stats.failed_deliveries || 0),
                    pending_deliveries: Number(stats.pending_deliveries || 0),
                    average_delivery_time: avgTime ? Math.round(avgTime) : null,
                },
                deliveryTrends: trendsRes.map((t: any) => {
                    const dayStr =
                        t.day instanceof Date
                            ? t.day.toISOString().split('T')[0]
                            : typeof t.day === 'string'
                              ? t.day.substring(0, 10)
                              : String(t.day);
                    return {
                        day: dayStr,
                        target: '', // Placeholder to match interface if needed
                        successful: Number(t.successful),
                        failed: Number(t.failed),
                    };
                }),
                topEventTypes: topEventsRes.map((e: any) => ({
                    target: '', // Placeholder
                    event_type: e.event_type || 'unknown',
                    total: Number(e.total),
                })),
                statusCodeDistribution: statusCodeRes.map((s: any) => ({
                    target: '', // Placeholder
                    response_code: s.response_code || 0,
                    total: Number(s.total),
                })),
            };
        } catch (error) {
            logger.error('Failed to get dispatch overview', error as Error);
            throw error;
        }
    }

    static async getIngestOverview(
        days: number = 7,
        workspaceId: string,
        projectId: string
    ) {
        try {
            // Cast to any to avoid "Type mismatch" between dashboard's drizzle-orm and shared's drizzle-orm
            const db = this.getClient() as any;
            const dateThreshold = new Date();
            dateThreshold.setDate(dateThreshold.getDate() - days);

            const whereClause = and(
                eq(analyticsIngestDay.projectId as any, projectId),
                gte(
                    analyticsIngestDay.bucketDay as any,
                    dateThreshold.toISOString()
                )
            );

            // 1. Stats
            const statsPromise = db
                .select({
                    total_events: sql<number>`sum(${analyticsIngestDay.totalEvents})`,
                    successful_events: sql<number>`sum(${analyticsIngestDay.successfulEvents})`,
                    failed_events: sql<number>`sum(${analyticsIngestDay.failedEvents})`,
                    pending_events: sql<number>`sum(${analyticsIngestDay.pendingEvents})`,
                    ingests: sql<number>`count(distinct ${analyticsIngestDay.sourceId})`,
                })
                .from(analyticsIngestDay)
                .where(whereClause);

            // 2. Receive Trends
            const trendsPromise = db
                .select({
                    day: analyticsIngestDay.bucketDay,
                    events: sql<number>`sum(${analyticsIngestDay.totalEvents})`,
                })
                .from(analyticsIngestDay)
                .where(whereClause)
                .groupBy(analyticsIngestDay.bucketDay)
                .orderBy(desc(analyticsIngestDay.bucketDay as any));

            // 3. Top Sources
            const topSourcesPromise = db
                .select({
                    source: analyticsIngestDay.sourceId,
                    total: sql<number>`sum(${analyticsIngestDay.totalEvents})`,
                })
                .from(analyticsIngestDay)
                .where(whereClause)
                .groupBy(analyticsIngestDay.sourceId)
                .orderBy(desc(sql`sum(${analyticsIngestDay.totalEvents})`))
                .limit(10);

            // 4. Process Status Distribution
            const statusPromise = db
                .select({
                    processing_status: analyticsIngestDay.processingStatus,
                    total: sql<number>`sum(${analyticsIngestDay.totalEvents})`,
                })
                .from(analyticsIngestDay)
                .where(whereClause)
                .groupBy(analyticsIngestDay.processingStatus)
                .orderBy(desc(sql`sum(${analyticsIngestDay.totalEvents})`));

            // 5. Failure Trends
            const failureTrendsPromise = db
                .select({
                    day: analyticsIngestDay.bucketDay,
                    total: sql<number>`sum(${analyticsIngestDay.failedEvents})`,
                })
                .from(analyticsIngestDay)
                .where(whereClause)
                .groupBy(analyticsIngestDay.bucketDay)
                .orderBy(desc(analyticsIngestDay.bucketDay as any));

            const [
                statsRes,
                trendsRes,
                topSourcesRes,
                statusRes,
                failureTrendsRes,
            ] = await Promise.all([
                statsPromise,
                trendsPromise,
                topSourcesPromise,
                statusPromise,
                failureTrendsPromise,
            ]);

            const stats = statsRes[0];

            return {
                stats: {
                    ingests: Number(stats.ingests || 0),
                    total_events: Number(stats.total_events || 0),
                    successful_events: Number(stats.successful_events || 0),
                    failed_events: Number(stats.failed_events || 0),
                    pending_events: Number(stats.pending_events || 0),
                },
                receiveTrends: trendsRes.map((t: any) => {
                    const dayStr =
                        t.day instanceof Date
                            ? t.day.toISOString().split('T')[0]
                            : typeof t.day === 'string'
                              ? t.day.substring(0, 10)
                              : String(t.day);
                    return {
                        day: dayStr,
                        events: Number(t.events),
                    };
                }),
                topSources: topSourcesRes.map((s: any) => ({
                    source: s.source || 'unknown',
                    total: Number(s.total),
                })),
                processStatusDistribution: statusRes.map((s: any) => {
                    const code = Number(s.processing_status);
                    let statusStr = 'unknown';
                    if (code === 0) statusStr = 'pending';
                    else if (code === 1) statusStr = 'processed';
                    else if (code === 2) statusStr = 'failed';

                    return {
                        processing_status: statusStr,
                        total: Number(s.total),
                    };
                }),
                failureTrends: failureTrendsRes.map((f: any) => {
                    const dayStr =
                        f.day instanceof Date
                            ? f.day.toISOString().split('T')[0]
                            : typeof f.day === 'string'
                              ? f.day.substring(0, 10)
                              : String(f.day);
                    return {
                        day: dayStr,
                        total: Number(f.total),
                    };
                }),
            };
        } catch (error) {
            logger.error('Failed to get ingest overview', error as Error);
            throw error;
        }
    }
}
