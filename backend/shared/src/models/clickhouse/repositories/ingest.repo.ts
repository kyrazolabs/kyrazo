import { clickhouseConfig, logger } from '../../../configs';
import { SQLIngestEvent } from '../types';

export class IngestRepo {
    private static getClient() {
        return clickhouseConfig.getClient();
    }
    static async insert(data: SQLIngestEvent[]): Promise<void> {
        try {
            const client = this.getClient();
            if (!client) {
                logger.warn(
                    `ClickHouse client not available, skipping insert into delivery_attempts`
                );
                logger.debug(
                    `Data that would be inserted:`,
                    JSON.stringify(data, null, 2)
                );
                return;
            }

            await client.insert({
                table: 'ingest_events',
                values: data,
                format: 'JSONEachRow',
            });

            logger.info(
                `Successfully inserted ${data.length} record(s) into ingest_events`
            );
        } catch (error) {
            logger.error(
                `Failed to insert data into ingest_events:`,
                error as Error
            );
            logger.warn('Continuing without ClickHouse analytics storage');
            throw error;
        }
    }

    static async getIngestEventById(
        eventId: string,
        workspaceId: string,
        projectId: string
    ): Promise<SQLIngestEvent[]> {
        try {
            const client = this.getClient();
            if (!client) {
                logger.warn(
                    'ClickHouse client not available, returning empty result for query'
                );
                return [];
            }

            const query = `
                    SELECT * FROM ingest_events
                    WHERE event_id = {eventId:String} AND workspace_id = {workspaceId:String} AND project_id = {projectId:String}
                    LIMIT 1
                `;
            const params: Record<string, string | number> = {
                eventId,
                workspaceId,
                projectId,
            };

            const rows = await client.query({
                query,
                format: 'JSONEachRow',
                query_params: params,
            });

            const data = await rows.json<SQLIngestEvent>();
            return data;
        } catch (error) {
            logger.error('Failed to get delivered event', error as Error);
            throw error;
        }
    }
    static async getIngestEvents(
        workspaceId: string,
        projectId: string,
        status: string | undefined,
        limit: number,
        page: number
    ): Promise<{ data: SQLIngestEvent[]; total: number }> {
        try {
            const client = this.getClient();
            if (!client) {
                logger.warn(
                    'ClickHouse client not available, returning empty result for query'
                );
                return { data: [], total: 0 };
            }

            const perPage = Math.min(limit, 100);
            const skip = (page - 1) * perPage;

            const conditions = [
                'workspace_id = {workspaceId:String}',
                'project_id = {projectId:String}',
            ];
            const params: Record<string, string | number> = {
                workspaceId,
                projectId,
                limit: perPage,
                offset: skip,
            };

            if (status) {
                conditions.push('status = {status:String}');
                params.status = status;
            }

            const whereClause = `WHERE ${conditions.join(' AND ')}`;

            const query = `
                    SELECT * FROM ingest_events
                    ${whereClause}
                    ORDER BY received_at DESC
                    LIMIT {limit:Int32} OFFSET {offset:Int32}
                `;

            const countQuery = `
                    SELECT count() AS total FROM ingest_events
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

            const data = await rows.json<SQLIngestEvent>();
            const total =
                (await countRows.json<{ total: number }>())[0]?.total ?? 0;

            return { data, total };
        } catch (error) {
            logger.error(
                'Unexpected error in DeliveryRepo.getDeliveries',
                error as Error
            );
            throw error;
        }
    }

    static async getReceivedEventsBySource(
        sourceId: string,
        workspaceId: string,
        projectId: string,
        limit: number,
        page: number
    ): Promise<{ data: SQLIngestEvent[]; total: number }> {
        try {
            const client = this.getClient();
            if (!client) {
                logger.warn(
                    'ClickHouse client not available, returning empty result for query'
                );
                return { data: [], total: 0 };
            }

            const perPage = Math.min(limit, 100);
            const skip = (page - 1) * perPage;

            const query = `
                      SELECT * FROM ingest_events
                      WHERE source_id = {sourceId:String} AND workspace_id = {workspaceId:String} AND project_id = {projectId:String}
                      ORDER BY processed_at DESC
                      LIMIT {limit:Int32} OFFSET {offset:Int32}
                  `;
            const countQuery = `
                      SELECT count() AS total FROM ingest_events
                      WHERE source_id = {sourceId:String} AND workspace_id = {workspaceId:String} AND project_id = {projectId:String}
                  `;
            const [rows, countRows] = await Promise.all([
                client.query({
                    query,
                    format: 'JSONEachRow',
                    query_params: {
                        sourceId,
                        workspaceId,
                        projectId,
                        limit: perPage,
                        offset: skip,
                    },
                }),
                client.query({
                    query: countQuery,
                    format: 'JSONEachRow',
                    query_params: { sourceId, workspaceId, projectId },
                }),
            ]);

            const data = await rows.json<SQLIngestEvent>();
            const total = (await countRows.json<{ total: number }>())[0].total;
            return { data, total };
        } catch (error) {
            logger.error(
                'Unexpected error in DeliveryRepo.getDeliveriesBySource',
                error as Error
            );
            throw error;
        }
    }

    static async getIngestOverview(
        days: number = 7,
        workspaceId: string,
        projectId: string
    ): Promise<{
        stats: {
            total_events: number;
            successful_events: number;
            failed_events: number;
            pending_events: number;
        };
        receiveTrends: {
            day: string;
            events: number;
        }[];
        topSources: {
            source: string;
            total: number;
        }[];
        processStatusDistribution: {
            processing_status: number;
            total: number;
        }[];
        failureTrends: {
            day: string;
            total: number;
        }[];
    }> {
        try {
            const client = this.getClient();
            if (!client) {
                logger.warn(
                    'ClickHouse client not available, returning empty result for query'
                );
                return {
                    stats: {
                        total_events: 0,
                        successful_events: 0,
                        failed_events: 0,
                        pending_events: 0,
                    },
                    receiveTrends: [
                        {
                            day: '',
                            events: 0,
                        },
                    ],
                    topSources: [
                        {
                            source: '',
                            total: 0,
                        },
                    ],
                    processStatusDistribution: [
                        {
                            processing_status: 0,
                            total: 0,
                        },
                    ],
                    failureTrends: [
                        {
                            day: '',
                            total: 0,
                        },
                    ],
                };
            }

            const params: Record<string, string | number> = {
                days,
                workspaceId,
                projectId,
            };

            const statsQuery = `
                SELECT
                    COUNT() AS total_events,
                    COUNTIf(processing_status = 'processed') AS successful_events,
                    COUNTIf(processing_status = 'failed') AS failed_events,
                    COUNTIf(processing_status = 'pending') AS pending_events
                FROM ingest_events
                WHERE toDate(received_at) >= today() - INTERVAL {days:Int32} days
                    AND workspace_id = {workspaceId:String}
                    AND project_id = {projectId:String}
            `;

            const receiveTrendsQuery = `
                SELECT
                    toDate(received_at) AS day,
                    COUNT() AS events
                FROM ingest_events
                WHERE toDate(received_at) >= today() - INTERVAL {days:Int32} days
                    AND workspace_id = {workspaceId:String}
                    AND project_id = {projectId:String} 
                GROUP BY day
                ORDER BY day DESC;
            `;

            const topSourcesQuery = `
                SELECT
                    source,
                    COUNT() AS total
                FROM ingest_events
                WHERE toDate(received_at) >= today() - INTERVAL {days:Int32} days
                    AND workspace_id = {workspaceId:String}
                    AND project_id = {projectId:String} 
                GROUP BY source
                ORDER BY total DESC
                LIMIT 10;
            `;

            const processStatusDistributionQuery = `
                SELECT
                    processing_status,
                    COUNT() AS total
                FROM ingest_events
                WHERE toDate(received_at) >= today() - INTERVAL {days:Int32} days
                    AND workspace_id = {workspaceId:String}
                    AND project_id = {projectId:String}
                GROUP BY processing_status
                ORDER BY total DESC;
            `;

            const failureTrendsQuery = `
                SELECT
                    toDate(received_at) AS day,
                    COUNTIf(processing_status = 'failed') AS total
                FROM ingest_events
                WHERE toDate(received_at) >= today() - INTERVAL {days:Int32} days
                    AND workspace_id = {workspaceId:String}
                    AND project_id = {projectId:String}
                GROUP BY day
                ORDER BY day DESC;
            `;

            const [
                stats,
                receiveTrends,
                topSources,
                processStatusDistribution,
                failureTrends,
            ] = await Promise.all([
                client.query({
                    query: statsQuery,
                    format: 'JSONEachRow',
                    query_params: params,
                }),
                client.query({
                    query: receiveTrendsQuery,
                    format: 'JSONEachRow',
                    query_params: params,
                }),
                client.query({
                    query: topSourcesQuery,
                    format: 'JSONEachRow',
                    query_params: params,
                }),
                client.query({
                    query: processStatusDistributionQuery,
                    format: 'JSONEachRow',
                    query_params: params,
                }),
                client.query({
                    query: failureTrendsQuery,
                    format: 'JSONEachRow',
                    query_params: params,
                }),
            ]);

            const resultStats = await stats.json<{
                total_events: number;
                successful_events: number;
                failed_events: number;
                pending_events: number;
            }>();
            const resultReceiveTrends = await receiveTrends.json<{
                day: string;
                events: number;
            }>();
            const resultTopSources = await topSources.json<{
                source: string;
                total: number;
            }>();
            const resultProcessStatusDistribution =
                await processStatusDistribution.json<{
                    processing_status: number;
                    total: number;
                }>();
            const resultFailureTrends = await failureTrends.json<{
                day: string;
                total: number;
            }>();

            return {
                stats: resultStats[0] || {
                    total_events: 0,
                    successful_events: 0,
                    failed_events: 0,
                    pending_events: 0,
                },
                receiveTrends: resultReceiveTrends.length
                    ? resultReceiveTrends
                    : [
                          {
                              day: '',
                              events: 0,
                          },
                      ],
                topSources: resultTopSources || [
                    {
                        source: '',
                        total: 0,
                    },
                ],
                processStatusDistribution: resultProcessStatusDistribution || [
                    {
                        processing_status: 0,
                        total: 0,
                    },
                ],
                failureTrends: resultFailureTrends || [
                    {
                        day: '',
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
