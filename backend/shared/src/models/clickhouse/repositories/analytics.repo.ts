import { clickhouseConfig } from '../../../configs/clickhouse';
import logger from '../../../configs/logger';
import { prefixId, unprefixId, transformWithId } from '../../../utils/id';
import { SQLAnalyticsDispatchDay, SQLAnalyticsIngestDay } from '../types';

export class AnalyticsRepo {
    private static getClient() {
        return clickhouseConfig.getClient();
    }

    static async insertDispatchDay(data: SQLAnalyticsDispatchDay[]): Promise<void> {
        if (data.length === 0) return;

        const BATCH_SIZE = 1000;
        const client = this.getClient();
        if (!client) {
            logger.warn('ClickHouse client not available, skipping insertDispatchDay');
            return;
        }

        for (let i = 0; i < data.length; i += BATCH_SIZE) {
            const batch = data.slice(i, i + BATCH_SIZE);
            let retries = 3;
            let delay = 1000;

            while (retries > 0) {
                try {
                    const transformedBatch = batch.map(row => ({
                        ...row,
                        namespace_id: prefixId(row.namespace_id, 'namespace') as string,
                        target_id: row.target_id ? (prefixId(row.target_id, 'target') as string) : null,
                    }));
                    await client.insert({
                        table: 'analytics_dispatch_day',
                        values: transformedBatch,
                        format: 'JSONEachRow',
                    });
                    logger.info(
                        `Successfully inserted ${batch.length} record(s) into analytics_dispatch_day`
                    );
                    break; // Success
                } catch (error: any) {
                    const isMemoryError =
                        error?.message?.includes('MEMORY_LIMIT_EXCEEDED') || error?.code === '241';
                    if (isMemoryError && retries > 1) {
                        logger.warn(
                            `ClickHouse memory limit exceeded, retrying in ${delay}ms... (${retries - 1} retries left)`
                        );
                        await new Promise(res => setTimeout(res, delay));
                        retries--;
                        delay *= 2; // Exponential backoff
                        continue;
                    }
                    logger.error(
                        `Failed to insert data into analytics_dispatch_day:`,
                        error as Error
                    );
                    throw error;
                }
            }
        }
    }

    static async insertIngestDay(data: SQLAnalyticsIngestDay[]): Promise<void> {
        if (data.length === 0) return;

        const BATCH_SIZE = 1000;
        const client = this.getClient();
        if (!client) {
            logger.warn('ClickHouse client not available, skipping insertIngestDay');
            return;
        }

        for (let i = 0; i < data.length; i += BATCH_SIZE) {
            const batch = data.slice(i, i + BATCH_SIZE);
            let retries = 3;
            let delay = 1000;

            while (retries > 0) {
                try {
                    const transformedBatch = batch.map(row => ({
                        ...row,
                        namespace_id: prefixId(row.namespace_id, 'namespace') as string,
                        source_id: row.source_id ? (prefixId(row.source_id, 'source') as string) : null,
                    }));
                    await client.insert({
                        table: 'analytics_ingest_day',
                        values: transformedBatch,
                        format: 'JSONEachRow',
                    });
                    logger.info(
                        `Successfully inserted ${batch.length} record(s) into analytics_ingest_day`
                    );
                    break;
                } catch (error: any) {
                    const isMemoryError =
                        error?.message?.includes('MEMORY_LIMIT_EXCEEDED') || error?.code === '241';
                    if (isMemoryError && retries > 1) {
                        logger.warn(
                            `ClickHouse memory limit exceeded, retrying in ${delay}ms... (${retries - 1} retries left)`
                        );
                        await new Promise(res => setTimeout(res, delay));
                        retries--;
                        delay *= 2;
                        continue;
                    }
                    logger.error(
                        `Failed to insert data into analytics_ingest_day:`,
                        error as Error
                    );
                    throw error;
                }
            }
        }
    }

    static async getDispatchOverview(days: number = 7, workspaceId: string, namespaceId: string) {
        try {
            const client = this.getClient();
            if (!client) return null;

            const params = { days, namespaceId: prefixId(namespaceId, 'namespace') as string };

            // 1. Overall Stats
            const statsQuery = `
                SELECT
                    count(DISTINCT target_id) AS total_targets,
                    sum(total_deliveries) AS total_deliveries,
                    sum(successful_deliveries) AS successful_deliveries,
                    sum(failed_deliveries) AS failed_deliveries,
                    sum(pending_deliveries) AS pending_deliveries,
                    sum(delivery_time_sum) AS weighted_time_sum
                FROM analytics_dispatch_day
                WHERE bucket_day >= today() - INTERVAL {days:Int32} DAY
                  AND namespace_id = {namespaceId:String}
            `;

            // 2. Delivery Trends
            const trendsQuery = `
                SELECT
                    bucket_day AS day,
                    sum(successful_deliveries) AS successful,
                    sum(failed_deliveries) AS failed
                FROM analytics_dispatch_day
                WHERE bucket_day >= today() - INTERVAL {days:Int32} DAY
                  AND namespace_id = {namespaceId:String}
                GROUP BY day
                ORDER BY day DESC
            `;

            // 3. Top Event Types
            const topEventsQuery = `
                SELECT
                    event_type,
                    sum(total_deliveries) AS total
                FROM analytics_dispatch_day
                WHERE bucket_day >= today() - INTERVAL {days:Int32} DAY
                  AND namespace_id = {namespaceId:String}
                GROUP BY event_type
                ORDER BY total DESC
                LIMIT 10
            `;

            // 4. Status Code Distribution
            const statusCodeQuery = `
                SELECT
                    response_code,
                    sum(total_deliveries) AS total
                FROM analytics_dispatch_day
                WHERE bucket_day >= today() - INTERVAL {days:Int32} DAY
                  AND namespace_id = {namespaceId:String}
                  AND response_code IS NOT NULL
                GROUP BY response_code
                ORDER BY total DESC
            `;

            const [statsRes, trendsRes, topEventsRes, statusCodeRes] = await Promise.all([
                client.query({ query: statsQuery, format: 'JSONEachRow', query_params: params }),
                client.query({ query: trendsQuery, format: 'JSONEachRow', query_params: params }),
                client.query({
                    query: topEventsQuery,
                    format: 'JSONEachRow',
                    query_params: params,
                }),
                client.query({
                    query: statusCodeQuery,
                    format: 'JSONEachRow',
                    query_params: params,
                }),
            ]);

            const statsList = await statsRes.json<any>();
            const stats = statsList[0] || {};

            const avgTime =
                Number(stats.total_deliveries) > 0
                    ? Math.round(Number(stats.weighted_time_sum) / Number(stats.total_deliveries))
                    : null;

            return {
                stats: {
                    total_targets: Number(stats.total_targets || 0),
                    total_deliveries: Number(stats.total_deliveries || 0),
                    successful_deliveries: Number(stats.successful_deliveries || 0),
                    failed_deliveries: Number(stats.failed_deliveries || 0),
                    pending_deliveries: Number(stats.pending_deliveries || 0),
                    average_delivery_time: avgTime,
                },
                deliveryTrends: (await trendsRes.json<any>()).map((t: any) => ({
                    ...transformWithId(t, 'delivery'),
                    day: t.day,
                    target: '',
                    successful: Number(t.successful),
                    failed: Number(t.failed),
                })),
                topEventTypes: (await topEventsRes.json<any>()).map((e: any) => ({
                    ...transformWithId(e, 'event'),
                    target: '',
                    event_type: e.event_type || 'unknown',
                    total: Number(e.total),
                })),
                statusCodeDistribution: (await statusCodeRes.json<any>()).map((s: any) => ({
                    ...transformWithId(s, 'target'),
                    target: '',
                    response_code: Number(s.response_code),
                    total: Number(s.total),
                })),
            };
        } catch (error) {
            logger.error('Failed to get ClickHouse dispatch overview', error as Error);
            throw error;
        }
    }

    static async getTargetOverview(
        days: number = 7,
        workspaceId: string,
        targetId: string,
        namespaceId: string
    ) {
        try {
            const client = this.getClient();
            if (!client) return null;

            const params = {
                days,
                namespaceId: prefixId(namespaceId, 'namespace') as string,
                targetId: prefixId(targetId, 'target') as string,
            };

            const statsQuery = `
                SELECT
                    count(DISTINCT target_id) AS total_targets,
                    sum(total_deliveries) AS total_deliveries,
                    sum(successful_deliveries) AS successful_deliveries,
                    sum(failed_deliveries) AS failed_deliveries,
                    sum(pending_deliveries) AS pending_deliveries,
                    sum(delivery_time_sum) AS weighted_time_sum
                FROM analytics_dispatch_day
                WHERE bucket_day >= today() - INTERVAL {days:Int32} DAY
                  AND namespace_id = {namespaceId:String}
                  AND target_id = {targetId:String}
            `;

            const trendsQuery = `
                SELECT
                    bucket_day AS day,
                    sum(successful_deliveries) AS successful,
                    sum(failed_deliveries) AS failed
                FROM analytics_dispatch_day
                WHERE bucket_day >= today() - INTERVAL {days:Int32} DAY
                  AND namespace_id = {namespaceId:String}
                  AND target_id = {targetId:String}
                GROUP BY day
                ORDER BY day DESC
            `;

            const topEventsQuery = `
                SELECT
                    event_type,
                    sum(total_deliveries) AS total
                FROM analytics_dispatch_day
                WHERE bucket_day >= today() - INTERVAL {days:Int32} DAY
                  AND namespace_id = {namespaceId:String}
                  AND target_id = {targetId:String}
                GROUP BY event_type
                ORDER BY total DESC
                LIMIT 10
            `;

            const statusCodeQuery = `
                SELECT
                    response_code,
                    sum(total_deliveries) AS total
                FROM analytics_dispatch_day
                WHERE bucket_day >= today() - INTERVAL {days:Int32} DAY
                  AND namespace_id = {namespaceId:String}
                  AND target_id = {targetId:String}
                  AND response_code IS NOT NULL
                GROUP BY response_code
                ORDER BY total DESC
            `;

            const [statsRes, trendsRes, topEventsRes, statusCodeRes] = await Promise.all([
                client.query({ query: statsQuery, format: 'JSONEachRow', query_params: params }),
                client.query({ query: trendsQuery, format: 'JSONEachRow', query_params: params }),
                client.query({
                    query: topEventsQuery,
                    format: 'JSONEachRow',
                    query_params: params,
                }),
                client.query({
                    query: statusCodeQuery,
                    format: 'JSONEachRow',
                    query_params: params,
                }),
            ]);

            const statsList = await statsRes.json<any>();
            const stats = statsList[0] || {};

            const avgTime =
                Number(stats.total_deliveries) > 0
                    ? Math.round(Number(stats.weighted_time_sum) / Number(stats.total_deliveries))
                    : null;

            return {
                stats: {
                    total_targets: Number(stats.total_targets || 0),
                    total_deliveries: Number(stats.total_deliveries || 0),
                    successful_deliveries: Number(stats.successful_deliveries || 0),
                    failed_deliveries: Number(stats.failed_deliveries || 0),
                    pending_deliveries: Number(stats.pending_deliveries || 0),
                    average_delivery_time: avgTime,
                },
                deliveryTrends: (await trendsRes.json<any>()).map((t: any) => ({
                    ...transformWithId(t, 'delivery'),
                    day: t.day,
                    target: '',
                    successful: Number(t.successful),
                    failed: Number(t.failed),
                })),
                topEventTypes: (await topEventsRes.json<any>()).map((e: any) => ({
                    ...transformWithId(e, 'event'),
                    target: '',
                    event_type: e.event_type || 'unknown',
                    total: Number(e.total),
                })),
                statusCodeDistribution: (await statusCodeRes.json<any>()).map((s: any) => ({
                    ...transformWithId(s, 'target'),
                    target: '',
                    response_code: Number(s.response_code),
                    total: Number(s.total),
                })),
            };
        } catch (error) {
            logger.error('Failed to get ClickHouse target overview', error as Error);
            throw error;
        }
    }

    static async getIngestOverview(days: number = 7, workspaceId: string, namespaceId: string) {
        try {
            const client = this.getClient();
            if (!client) return null;

            const params = { days, namespaceId: prefixId(namespaceId, 'namespace') as string };

            const statsQuery = `
                SELECT
                    sum(total_events) AS total_events,
                    sum(successful_events) AS successful_events,
                    sum(failed_events) AS failed_events,
                    sum(pending_events) AS pending_events,
                    count(DISTINCT source_id) AS ingests
                FROM analytics_ingest_day
                WHERE bucket_day >= today() - INTERVAL {days:Int32} DAY
                  AND namespace_id = {namespaceId:String}
            `;

            const trendsQuery = `
                SELECT
                    bucket_day AS day,
                    sum(total_events) AS events
                FROM analytics_ingest_day
                WHERE bucket_day >= today() - INTERVAL {days:Int32} DAY
                  AND namespace_id = {namespaceId:String}
                GROUP BY day
                ORDER BY day DESC
            `;

            const topSourcesQuery = `
                SELECT
                    source_id AS source,
                    sum(total_events) AS total
                FROM analytics_ingest_day
                WHERE bucket_day >= today() - INTERVAL {days:Int32} DAY
                  AND namespace_id = {namespaceId:String}
                GROUP BY source
                ORDER BY total DESC
                LIMIT 10
            `;

            const statusQuery = `
                SELECT
                    processing_status,
                    sum(total_events) AS total
                FROM analytics_ingest_day
                WHERE bucket_day >= today() - INTERVAL {days:Int32} DAY
                  AND namespace_id = {namespaceId:String}
                GROUP BY processing_status
                ORDER BY total DESC
            `;

            const failureTrendsQuery = `
                SELECT
                    bucket_day AS day,
                    sum(failed_events) AS total
                FROM analytics_ingest_day
                WHERE bucket_day >= today() - INTERVAL {days:Int32} DAY
                  AND namespace_id = {namespaceId:String}
                GROUP BY day
                ORDER BY day DESC
            `;

            const [statsRes, trendsRes, topSourcesRes, statusRes, failureTrendsRes] =
                await Promise.all([
                    client.query({
                        query: statsQuery,
                        format: 'JSONEachRow',
                        query_params: params,
                    }),
                    client.query({
                        query: trendsQuery,
                        format: 'JSONEachRow',
                        query_params: params,
                    }),
                    client.query({
                        query: topSourcesQuery,
                        format: 'JSONEachRow',
                        query_params: params,
                    }),
                    client.query({
                        query: statusQuery,
                        format: 'JSONEachRow',
                        query_params: params,
                    }),
                    client.query({
                        query: failureTrendsQuery,
                        format: 'JSONEachRow',
                        query_params: params,
                    }),
                ]);

            const statsList = await statsRes.json<any>();
            const stats = statsList[0] || {};

            return {
                stats: {
                    ingests: Number(stats.ingests || 0),
                    total_events: Number(stats.total_events || 0),
                    successful_events: Number(stats.successful_events || 0),
                    failed_events: Number(stats.failed_events || 0),
                    pending_events: Number(stats.pending_events || 0),
                },
                receiveTrends: (await trendsRes.json<any>()).map((t: any) => ({
                    ...transformWithId(t, 'event'),
                    day: t.day,
                    events: Number(t.events),
                })),
                topSources: (await topSourcesRes.json<any>()).map((s: any) => ({
                    ...transformWithId(s, 'source'),
                    source: s.source || 'unknown',
                    total: Number(s.total),
                })),
                processStatusDistribution: (await statusRes.json<any>()).map((s: any) => {
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
                failureTrends: (await failureTrendsRes.json<any>()).map((f: any) => ({
                    day: f.day,
                    total: Number(f.total),
                })),
            };
        } catch (error) {
            logger.error('Failed to get ClickHouse ingest overview', error as Error);
            throw error;
        }
    }
}
