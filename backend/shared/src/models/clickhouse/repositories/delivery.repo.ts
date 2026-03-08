import { clickhouseConfig } from '../../../configs/clickhouse';
import logger from '../../../configs/logger';
import { SQLDeliveryAttempt } from '../types';
import { unprefixId } from '../../../utils/id';

export class DeliveryRepo {
    private static getClient() {
        return clickhouseConfig.getClient();
    }

    static async insert(data: SQLDeliveryAttempt[]): Promise<void> {
        try {
            const client = this.getClient();
            if (!client) {
                logger.warn(
                    `ClickHouse client not available, skipping insert into delivery_attempts`
                );
                logger.debug(`Data that would be inserted:`, JSON.stringify(data, null, 2));
                return;
            }

            await client.insert({
                table: 'delivery_attempts',
                values: data,
                format: 'JSONEachRow',
            });

            logger.info(`Successfully inserted ${data.length} record(s) into delivery_attempts`);
        } catch (error) {
            logger.error(`Failed to insert data into delivery_attempts:`, error as Error);
            logger.warn('Continuing without ClickHouse analytics storage');
            throw error;
        }
    }

    static async getDeliveries(
        workspaceId: string,
        namespaceId: string,
        status: string | undefined,
        limit: number,
        page: number
    ): Promise<{ data: SQLDeliveryAttempt[]; total: number }> {
        try {
            const client = this.getClient();
            if (!client) {
                logger.warn('ClickHouse client not available, returning empty result for query');
                return { data: [], total: 0 };
            }

            const perPage = Math.min(limit, 100);
            const skip = (page - 1) * perPage;

            const conditions = [
                'workspace_id = {workspaceId:String}',
                'namespace_id = {namespaceId:String}',
            ];
            const params: Record<string, string | number> = {
                workspaceId: unprefixId(workspaceId)!,
                namespaceId: unprefixId(namespaceId)!,
                limit: perPage,
                offset: skip,
            };

            if (status) {
                conditions.push('status = {status:String}');
                params.status = status;
            }

            const whereClause = `WHERE ${conditions.join(' AND ')}`;

            const query = `
                SELECT * FROM delivery_attempts
                ${whereClause}
                ORDER BY processed_at DESC
                LIMIT {limit:Int32} OFFSET {offset:Int32}
            `;

            const countQuery = `
                SELECT count() AS total FROM delivery_attempts
                ${whereClause}
            `;

            const [rows, countRows] = await Promise.all([
                client.query({
                    query,
                    format: 'JSONEachRow',
                    query_params: params,
                }),
                client.query({
                    query: countQuery,
                    format: 'JSONEachRow',
                    query_params: params,
                }),
            ]);

            const data = await rows.json<SQLDeliveryAttempt>();
            const total = (await countRows.json<{ total: number }>())[0]?.total ?? 0;

            return { data, total };
        } catch (error) {
            logger.error('Unexpected error in DeliveryRepo.getDeliveries', error as Error);
            throw error;
        }
    }

    static async getTargets(
        workspaceId: string,
        namespaceId: string,
        limit: number,
        page: number
    ): Promise<{
        data: Array<{
            target: string;
            attempts: number;
            success: number;
            failed: number;
        }>;
        total: number;
    }> {
        try {
            const client = this.getClient();
            if (!client) {
                logger.warn('ClickHouse client not available, returning empty result for query');
                return { data: [], total: 0 };
            }

            const perPage = Math.min(limit, 100);
            const skip = (page - 1) * perPage;

            const conditions = [
                'workspace_id = {workspaceId:String}',
                'namespace_id = {namespaceId:String}',
            ];
            const params: Record<string, string | number> = {
                workspaceId: unprefixId(workspaceId)!,
                namespaceId: unprefixId(namespaceId)!,
                limit: perPage,
                offset: skip,
            };

            const whereClause = `WHERE ${conditions.join(' AND ')}`;

            const query = `
                SELECT
                    target,
                    count() AS attempts,
                    countIf(status = 'delivered') AS success,
                    countIf(status IN ('failed', 'timeout', 'network_error')) AS failed
                FROM delivery_attempts
                ${whereClause}
                GROUP BY target
                ORDER BY attempts DESC
                LIMIT {limit:Int32} OFFSET {offset:Int32}
            `;

            const countQuery = `
                SELECT count() AS total
                FROM (
                    SELECT target
                    FROM delivery_attempts
                    ${whereClause}
                    GROUP BY target
                )
                `;

            const [rows, countRows] = await Promise.all([
                client.query({
                    query,
                    format: 'JSONEachRow',
                    query_params: params,
                }),
                client.query({
                    query: countQuery,
                    format: 'JSONEachRow',
                    query_params: params,
                }),
            ]);

            const data = await rows.json<{
                target: string;
                attempts: number;
                success: number;
                failed: number;
            }>();
            const total = (await countRows.json<{ total: number }>())[0]?.total ?? 0;

            return { data, total };
        } catch (error) {
            logger.error('Unexpected error in DeliveryRepo.getTargets', error as Error);
            throw error;
        }
    }

    static decodeTarget(encoded: string): string {
        const b64 = decodeURIComponent(encoded);
        return atob(b64);
    }

    static async getDeliveriesByTarget(
        target: string,
        workspaceId: string,
        namespaceId: string,
        limit: number,
        page: number
    ): Promise<{ data: SQLDeliveryAttempt[]; total: number }> {
        try {
            const client = this.getClient();
            if (!client) {
                logger.warn('ClickHouse client not available, returning empty result for query');
                return { data: [], total: 0 };
            }

            const perPage = Math.min(limit, 100);
            const skip = (page - 1) * perPage;

            const targeet = this.decodeTarget(target);
            const params: Record<string, string | number> = {
                targeet,
                workspaceId: unprefixId(workspaceId)!,
                namespaceId: unprefixId(namespaceId)!,
                limit: perPage,
                offset: skip,
            };

            const query = `
                SELECT * FROM delivery_attempts
                WHERE target = {targeet:String} AND workspace_id = {workspaceId:String} AND namespace_id = {namespaceId:String}
                ORDER BY processed_at DESC
                LIMIT {limit:Int32} OFFSET {offset:Int32}
            `;

            const countQuery = `
                SELECT count() AS total FROM delivery_attempts
                WHERE target = {targeet:String} AND workspace_id = {workspaceId:String} AND namespace_id = {namespaceId:String}
            `;

            const [rows, countRows] = await Promise.all([
                client.query({
                    query,
                    format: 'JSONEachRow',
                    query_params: params,
                }),
                client.query({
                    query: countQuery,
                    format: 'JSONEachRow',
                    query_params: params,
                }),
            ]);

            const data = await rows.json<SQLDeliveryAttempt>();
            const total = (await countRows.json<{ total: number }>())[0]?.total ?? 0;

            return { data, total };
        } catch (error) {
            logger.error('Failed to get delivered event', error as Error);
            throw error;
        }
    }

    static async getDeliveriesBySource(
        sourceId: string,
        workspaceId: string,
        namespaceId: string,
        limit: number,
        page: number
    ): Promise<{ data: SQLDeliveryAttempt[]; total: number }> {
        try {
            const client = this.getClient();
            if (!client) {
                logger.warn('ClickHouse client not available, returning empty result for query');
                return { data: [], total: 0 };
            }

            const perPage = Math.min(limit, 100);
            const skip = (page - 1) * perPage;

            const query = `
                SELECT * FROM delivery_attempts
                WHERE source_id = {sourceId:String} AND workspace_id = {workspaceId:String} AND namespace_id = {namespaceId:String}
                ORDER BY received_at DESC
                LIMIT {limit:Int32} OFFSET {offset:Int32}
            `;
            const countQuery = `
                SELECT count() AS total FROM delivery_attempts
                WHERE source_id = {sourceId:String} AND workspace_id = {workspaceId:String} AND namespace_id = {namespaceId:String}
            `;
            const [rows, countRows] = await Promise.all([
                client.query({
                    query,
                    format: 'JSONEachRow',
                    query_params: {
                        sourceId: unprefixId(sourceId)!,
                        workspaceId: unprefixId(workspaceId)!,
                        namespaceId: unprefixId(namespaceId)!,
                        limit: perPage,
                        offset: skip,
                    },
                }),
                client.query({
                    query: countQuery,
                    format: 'JSONEachRow',
                    query_params: {
                        sourceId: unprefixId(sourceId)!,
                        workspaceId: unprefixId(workspaceId)!,
                        namespaceId: unprefixId(namespaceId)!,
                    },
                }),
            ]);

            const data = await rows.json<SQLDeliveryAttempt>();
            const total = (await countRows.json<{ total: number }>())[0].total;
            return { data, total };
        } catch (error) {
            logger.error('Unexpected error in DeliveryRepo.getDeliveriesBySource', error as Error);
            throw error;
        }
    }

    static async getDeliveryById(
        deliveryId: string,
        workspaceId: string,
        namespaceId: string
    ): Promise<SQLDeliveryAttempt[]> {
        try {
            const client = this.getClient();
            if (!client) {
                logger.warn('ClickHouse client not available, returning empty result for query');
                return [];
            }

            const query = `
                SELECT * FROM delivery_attempts
                WHERE delivery_id = '${unprefixId(deliveryId)}' AND workspace_id = '${unprefixId(workspaceId)}' AND namespace_id = '${unprefixId(namespaceId)}'
                LIMIT 1
            `;

            const rows = await client.query({
                query,
                format: 'JSONEachRow',
            });

            const data = await rows.json<SQLDeliveryAttempt>();
            return data;
        } catch (error) {
            logger.error('Failed to get delivered event', error as Error);
            throw error;
        }
    }

    static async getPendingEvents(workspaceId: string, limit = 100): Promise<SQLDeliveryAttempt[]> {
        try {
            const client = this.getClient();
            if (!client) {
                logger.warn('ClickHouse client not available, returning empty result for query');
                return [];
            }
            const query = `
                SELECT * FROM delivery_attempts
                WHERE status = 'pending' AND ${workspaceId}
                ORDER BY scheduled_at ASC
                LIMIT ${limit}
            `;
            const rows = await client.query({
                query,
                format: 'JSONEachRow',
            });

            const data = await rows.json<SQLDeliveryAttempt>();
            return data;
        } catch (error) {
            logger.error('Failed to get pending events ', error as Error);
            throw error;
        }
    }

    static async getStats(
        workspace_id: string,
        namespace_id: string
    ): Promise<{
        total_deliveries: number;
        successful_deliveries: number;
        failed_deliveries: number;
        pending_deliveries: number;
        average_delivery_time: number | null;
    }> {
        try {
            const client = this.getClient();
            if (!client) {
                logger.warn('ClickHouse client not available, returning empty result for query');
                return {
                    total_deliveries: 0,
                    successful_deliveries: 0,
                    failed_deliveries: 0,
                    pending_deliveries: 0,
                    average_delivery_time: null,
                };
            }
            let query = `
                SELECT
                    count() as total_deliveries,
                    countIf(status = 'delivered') as successful_deliveries,
                    countIf(status = 'failed') as failed_deliveries,
                    countIf(status = 'pending') as pending_deliveries,
                    avg(response_time_ms) as average_delivery_time
                FROM delivery_attempts
            `;

            if (workspace_id && namespace_id) {
                query += ` WHERE workspace_id = '${unprefixId(workspace_id)}' AND namespace_id = '${unprefixId(namespace_id)}'`;
            } else if (workspace_id) {
                query += ` WHERE workspace_id = '${unprefixId(workspace_id)}'`;
            }

            const rows = await client.query({
                query,
                format: 'JSONEachRow',
            });
            const result = await rows.json<{
                total_deliveries: number;
                successful_deliveries: number;
                failed_deliveries: number;
                pending_deliveries: number;
                average_delivery_time: number | null;
            }>();

            return (
                result[0] || {
                    total_deliveries: 0,
                    successful_deliveries: 0,
                    failed_deliveries: 0,
                    pending_deliveries: 0,
                    average_delivery_time: null,
                }
            );
        } catch (error) {
            logger.error('Failed to get stats ', error as Error);
            throw error;
        }
    }
    static async getDeliveriesOverviewByTarget(
        days: number = 7,
        target: string,
        workspaceId: string,
        namespaceId: string
    ): Promise<{
        stats: {
            total_deliveries: number;
            successful_deliveries: number;
            failed_deliveries: number;
            pending_deliveries: number;
            average_delivery_time: number | null;
        };
        deliveryTrends: {
            day: string;
            target: string;
            successful: number;
            failed: number;
        }[];
        topEventTypes: {
            target: string;
            event_type: string;
            total: number;
        }[];
        statusCodeDistribution: {
            target: string;
            response_code: number;
            total: number;
        }[];
    }> {
        try {
            const client = this.getClient();
            if (!client) {
                logger.warn('ClickHouse client not available, returning empty result for query');
                return {
                    stats: {
                        total_deliveries: 0,
                        successful_deliveries: 0,
                        failed_deliveries: 0,
                        pending_deliveries: 0,
                        average_delivery_time: null,
                    },
                    deliveryTrends: [
                        {
                            day: '',
                            target: '',
                            successful: 0,
                            failed: 0,
                        },
                    ],
                    topEventTypes: [
                        {
                            target: '',
                            event_type: '',
                            total: 0,
                        },
                    ],
                    statusCodeDistribution: [
                        {
                            target: '',
                            response_code: 0,
                            total: 0,
                        },
                    ],
                };
            }

            const targeet = this.decodeTarget(target);

            const params: Record<string, string | number> = {
                days,
                workspaceId: unprefixId(workspaceId)!,
                namespaceId: unprefixId(namespaceId)!,
                targeet,
            };

            const statsQuery = `
                SELECT
                    COUNT() AS total_deliveries,
                    COUNTIf(status = 'delivered') AS successful_deliveries,
                    COUNTIf(status IN ('failed', 'timeout', 'network_error')) AS failed_deliveries,
                    COUNTIf(status = 'pending') AS pending_deliveries,
                    AVG(response_time_ms) AS average_delivery_time
                FROM delivery_attempts
                WHERE toDate(scheduled_at) >= today() - INTERVAL {days:Int32} days
                    AND workspace_id = {workspaceId:String}
                    AND namespace_id = {namespaceId:String}
                    AND target = {targeet:String};
            `;
            const deliveryTrendsQuery = `
                SELECT
                    toDate(scheduled_at) AS day,
                    COUNTIf(status = 'delivered') AS successful,
                    COUNTIf(status IN ('failed', 'timeout', 'network_error')) AS failed
                FROM delivery_attempts
                WHERE toDate(scheduled_at) >= today() - INTERVAL {days:Int32} days
                    AND workspace_id = {workspaceId:String}
                    AND namespace_id = {namespaceId:String}
                    AND target = {targeet:String}
                GROUP BY day
                ORDER BY day DESC;
            `;

            const topEventTypesQuery = `
                SELECT
                    event_type,
                    COUNT() AS total
                FROM delivery_attempts
                WHERE toDate(scheduled_at) >= today() - INTERVAL {days:Int32} days
                    AND workspace_id = {workspaceId:String}
                    AND namespace_id = {namespaceId:String}
                    AND target = {targeet:String}
                GROUP BY event_type
                ORDER BY total DESC
                LIMIT 10;
            `;

            const statusCodeDistributionQuery = `
                SELECT
                    response_code,
                    COUNT() AS total
                FROM delivery_attempts
                WHERE toDate(scheduled_at) >= today() - INTERVAL {days:Int32} days
                    AND workspace_id = {workspaceId:String}
                    AND namespace_id = {namespaceId:String}
                    AND target = {targeet:String}
                    AND response_code != 0
                GROUP BY response_code
                ORDER BY total DESC;
            `;

            const [stats, deliveryTrends, topEventTypes, statusCodeDistribution] =
                await Promise.all([
                    client.query({
                        query: statsQuery,
                        format: 'JSONEachRow',
                        query_params: params,
                    }),
                    client.query({
                        query: deliveryTrendsQuery,
                        format: 'JSONEachRow',
                        query_params: params,
                    }),
                    client.query({
                        query: topEventTypesQuery,
                        format: 'JSONEachRow',
                        query_params: params,
                    }),
                    client.query({
                        query: statusCodeDistributionQuery,
                        format: 'JSONEachRow',
                        query_params: params,
                    }),
                ]);

            const resultStats = await stats.json<{
                total_deliveries: number;
                successful_deliveries: number;
                failed_deliveries: number;
                pending_deliveries: number;
                average_delivery_time: number | null;
            }>();
            const resultDeliveryTrends = await deliveryTrends.json<{
                workspace_id: string;
                namespace_id: string;
                day: string;
                target: string;
                successful: number;
                failed: number;
            }>();
            const resultTopEventTypes = await topEventTypes.json<{
                workspace_id: string;
                namespace_id: string;
                target: string;
                event_type: string;
                total: number;
            }>();
            const resultStatusCodeDistribution = await statusCodeDistribution.json<{
                workspace_id: string;
                namespace_id: string;
                target: string;
                response_code: number;
                total: number;
            }>();

            return {
                stats: resultStats[0] || {
                    total_deliveries: 0,
                    successful_deliveries: 0,
                    failed_deliveries: 0,
                    pending_deliveries: 0,
                    average_delivery_time: null,
                },
                deliveryTrends: resultDeliveryTrends.length ? resultDeliveryTrends : [],
                topEventTypes: resultTopEventTypes || [
                    {
                        target: '',
                        event_type: '',
                        total: 0,
                    },
                ],
                statusCodeDistribution: resultStatusCodeDistribution || [
                    {
                        target: '',
                        response_code: 0,
                        total: 0,
                    },
                ],
            };
        } catch (error) {
            logger.error('Failed to get stats ', error as Error);
            throw error;
        }
    }
    static async getDispatchOverview(
        days: number = 7,
        workspaceId: string,
        namespaceId: string
    ): Promise<{
        stats: {
            total_targets: number;
            total_deliveries: number;
            successful_deliveries: number;
            failed_deliveries: number;
            pending_deliveries: number;
            average_delivery_time: number | null;
        };
        deliveryTrends: {
            day: string;
            target: string;
            successful: number;
            failed: number;
        }[];
        topEventTypes: {
            target: string;
            event_type: string;
            total: number;
        }[];
        statusCodeDistribution: {
            target: string;
            response_code: number;
            total: number;
        }[];
    }> {
        try {
            const client = this.getClient();
            if (!client) {
                logger.warn('ClickHouse client not available, returning empty result for query');
                return {
                    stats: {
                        total_targets: 0,
                        total_deliveries: 0,
                        successful_deliveries: 0,
                        failed_deliveries: 0,
                        pending_deliveries: 0,
                        average_delivery_time: null,
                    },
                    deliveryTrends: [
                        {
                            day: '',
                            target: '',
                            successful: 0,
                            failed: 0,
                        },
                    ],
                    topEventTypes: [
                        {
                            target: '',
                            event_type: '',
                            total: 0,
                        },
                    ],
                    statusCodeDistribution: [
                        {
                            target: '',
                            response_code: 0,
                            total: 0,
                        },
                    ],
                };
            }

            const params: Record<string, string | number> = {
                days,
                workspaceId: unprefixId(workspaceId)!,
                namespaceId: unprefixId(namespaceId)!,
            };

            const statsQuery = `
                SELECT
                    COUNT(DISTINCT target) AS total_targets,
                    COUNT() AS total_deliveries,
                    COUNTIf(status = 'delivered') AS successful_deliveries,
                    COUNTIf(status IN ('failed', 'timeout', 'network_error')) AS failed_deliveries,
                    COUNTIf(status = 'pending') AS pending_deliveries,
                    AVG(response_time_ms) AS average_delivery_time
                FROM delivery_attempts
                WHERE toDate(scheduled_at) >= today() - INTERVAL {days:Int32} days
                    AND workspace_id = {workspaceId:String}
                    AND namespace_id = {namespaceId:String}
            `;

            const deliveryTrendsQuery = `
                SELECT
                    toDate(scheduled_at) AS day,
                    COUNTIf(status = 'delivered') AS successful,
                    COUNTIf(status IN ('failed', 'timeout', 'network_error')) AS failed
                FROM delivery_attempts
                WHERE toDate(scheduled_at) >= today() - INTERVAL {days:Int32} days
                    AND workspace_id = {workspaceId:String}
                    AND namespace_id = {namespaceId:String}
                GROUP BY day
                ORDER BY day DESC;
            `;

            const topEventTypesQuery = `
                SELECT
                    event_type,
                    COUNT() AS total
                FROM delivery_attempts
                WHERE toDate(scheduled_at) >= today() - INTERVAL {days:Int32} days
                    AND workspace_id = {workspaceId:String}
                    AND namespace_id = {namespaceId:String}
                GROUP BY event_type
                ORDER BY total DESC
                LIMIT 10;
            `;

            const statusCodeDistributionQuery = `
                SELECT
                    response_code,
                    COUNT() AS total
                FROM delivery_attempts
                WHERE toDate(scheduled_at) >= today() - INTERVAL {days:Int32} days
                    AND workspace_id = {workspaceId:String}
                    AND namespace_id = {namespaceId:String}
                    AND response_code != 0
                GROUP BY response_code
                ORDER BY total DESC;
            `;

            const [stats, deliveryTrends, topEventTypes, statusCodeDistribution] =
                await Promise.all([
                    client.query({
                        query: statsQuery,
                        format: 'JSONEachRow',
                        query_params: params,
                    }),
                    client.query({
                        query: deliveryTrendsQuery,
                        format: 'JSONEachRow',
                        query_params: params,
                    }),
                    client.query({
                        query: topEventTypesQuery,
                        format: 'JSONEachRow',
                        query_params: params,
                    }),
                    client.query({
                        query: statusCodeDistributionQuery,
                        format: 'JSONEachRow',
                        query_params: params,
                    }),
                ]);

            const resultStats = await stats.json<{
                total_targets: number;
                total_deliveries: number;
                successful_deliveries: number;
                failed_deliveries: number;
                pending_deliveries: number;
                average_delivery_time: number | null;
            }>();
            const resultDeliveryTrends = await deliveryTrends.json<{
                workspace_id: string;
                namespace_id: string;
                day: string;
                target: string;
                successful: number;
                failed: number;
            }>();
            const resultTopEventTypes = await topEventTypes.json<{
                workspace_id: string;
                namespace_id: string;
                target: string;
                event_type: string;
                total: number;
            }>();
            const resultStatusCodeDistribution = await statusCodeDistribution.json<{
                workspace_id: string;
                namespace_id: string;
                target: string;
                response_code: number;
                total: number;
            }>();

            return {
                stats: resultStats[0] || {
                    total_targets: 0,
                    total_deliveries: 0,
                    successful_deliveries: 0,
                    failed_deliveries: 0,
                    pending_deliveries: 0,
                    average_delivery_time: null,
                },
                deliveryTrends: resultDeliveryTrends.length ? resultDeliveryTrends : [],
                topEventTypes: resultTopEventTypes || [
                    {
                        target: '',
                        event_type: '',
                        total: 0,
                    },
                ],
                statusCodeDistribution: resultStatusCodeDistribution || [
                    {
                        target: '',
                        response_code: 0,
                        total: 0,
                    },
                ],
            };
        } catch (error) {
            logger.error('Failed to get stats ', error as Error);
            throw error;
        }
    }
}
