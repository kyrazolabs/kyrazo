import { clickhouseConfig, logger } from '../../../configs';
import { prefixId, unprefixId, transformWithId } from '../../../utils/id';
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
                logger.debug(`Data that would be inserted:`, JSON.stringify(data, null, 2));
                return;
            }

            // Asymmetric ID transformation:
            // - event_id and associated_event_id use unprefixId because they represent raw identifiers
            //   (often numeric/Snowflake) used for deduplication and internal lookups within the data layer.
            // - workspace_id, namespace_id, and source_id use prefixId to maintain consistent
            //   namespacing/entity identification across external systems and APIs.
            const transformedData = data.map(event => ({
                ...event,
                event_id: String(unprefixId(event.event_id)),
                workspace_id: String(prefixId(event.workspace_id, 'workspace')),
                namespace_id: String(prefixId(event.namespace_id, 'namespace')),
                source_id: String(prefixId(event.source_id, 'source')),
                associated_event_id: event.associated_event_id
                    ? String(unprefixId(event.associated_event_id))
                    : null,
            }));

            await client.insert({
                table: 'ingest_events',
                values: transformedData,
                format: 'JSONEachRow',
            });

            logger.info(`Successfully inserted ${data.length} record(s) into ingest_events`);
        } catch (error: any) {
            logger.error(`Failed to insert data into ingest_events:`, error);
            logger.warn('Continuing without ClickHouse analytics storage');
            throw error;
        }
    }

    static async getIngestEventById(
        eventId: string,
        workspaceId: string,
        namespaceId: string
    ): Promise<SQLIngestEvent[]> {
        try {
            const client = this.getClient();
            if (!client) {
                logger.warn('ClickHouse client not available, returning empty result for query');
                return [];
            }

            const query = `
                    SELECT * FROM ingest_events
                    WHERE event_id = {eventId:UInt64} AND workspace_id = {workspaceId:String} AND namespace_id = {namespaceId:String}
                    LIMIT 1
                `;
            const params: Record<string, string | number> = {
                eventId: BigInt(unprefixId(eventId) || '0').toString(),
                workspaceId: String(prefixId(workspaceId, 'workspace')),
                namespaceId: String(prefixId(namespaceId, 'namespace')),
            };

            const rows = await client.query({
                query,
                format: 'JSONEachRow',
                query_params: params,
            });

            const data = await rows.json<SQLIngestEvent>();
            return transformWithId(data, 'event') as SQLIngestEvent[];
        } catch (error: any) {
            (logger as any).error('Failed to get delivered event from ClickHouse', {
                error:
                    error instanceof Error ? { message: error.message, stack: error.stack } : error,
                eventId,
                workspaceId,
                namespaceId,
            });
            throw error;
        }
    }
    static async getIngestEvents(
        workspaceId: string,
        namespaceId: string,
        status: string | undefined,
        limit: number,
        page: number,
        eventId?: string
    ): Promise<{ data: SQLIngestEvent[]; total: number }> {
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
            const params: Record<string, string | number | bigint> = {
                workspaceId: prefixId(workspaceId, 'workspace') as string,
                namespaceId: prefixId(namespaceId, 'namespace') as string,
                limit: perPage,
                offset: skip,
            };

            if (status) {
                conditions.push('status = {status:String}');
                params.status = status;
            }

            if (eventId) {
                conditions.push('event_id = {eventId:UInt64}');
                params.eventId = BigInt(unprefixId(eventId) || '0').toString();
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
            const total = (await countRows.json<{ total: number }>())?.[0]?.total ?? 0;
            const transformedData = transformWithId(data, 'event') as SQLIngestEvent[];

            return { data: transformedData, total };
        } catch (error: any) {
            logger.error('Unexpected error in IngestRepo.getIngestEvents', error);
            throw error;
        }
    }

    static async getReceivedEventsBySource(
        sourceId: string,
        workspaceId: string,
        namespaceId: string,
        limit: number,
        page: number
    ): Promise<{ data: SQLIngestEvent[]; total: number }> {
        try {
            const client = this.getClient();
            if (!client) {
                logger.warn('ClickHouse client not available, returning empty result for query');
                return { data: [], total: 0 };
            }

            const perPage = Math.min(limit, 100);
            const skip = (page - 1) * perPage;

            const query = `
                      SELECT * FROM ingest_events
                      WHERE source_id = {sourceId:String} AND workspace_id = {workspaceId:String} AND namespace_id = {namespaceId:String}
                      ORDER BY processed_at DESC
                      LIMIT {limit:Int32} OFFSET {offset:Int32}
                  `;
            const countQuery = `
                      SELECT count() AS total FROM ingest_events
                      WHERE source_id = {sourceId:String} AND workspace_id = {workspaceId:String} AND namespace_id = {namespaceId:String}
                  `;
            const [rows, countRows] = await Promise.all([
                client.query({
                    query,
                    format: 'JSONEachRow',
                    query_params: {
                        sourceId: prefixId(sourceId, 'source') as string,
                        workspaceId: prefixId(workspaceId, 'workspace') as string,
                        namespaceId: prefixId(namespaceId, 'namespace') as string,
                        limit: perPage,
                        offset: skip,
                    },
                }),
                client.query({
                    query: countQuery,
                    format: 'JSONEachRow',
                    query_params: {
                        sourceId: prefixId(sourceId, 'source') as string,
                        workspaceId: prefixId(workspaceId, 'workspace') as string,
                        namespaceId: prefixId(namespaceId, 'namespace') as string,
                    },
                }),
            ]);

            const data = await rows.json<SQLIngestEvent>();
            const total = (await countRows.json<{ total: number }>())?.[0]?.total ?? 0;
            const transformedData = transformWithId(data, 'event') as SQLIngestEvent[];

            return { data: transformedData, total };
        } catch (error: any) {
            logger.error('Unexpected error in DeliveryRepo.getDeliveriesBySource', error);
            throw error;
        }
    }

    static async getIngestOverview(
        days: number = 7,
        workspaceId: string,
        namespaceId: string
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
                logger.warn('ClickHouse client not available, returning empty result for query');
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
                workspaceId: prefixId(workspaceId, 'workspace') as string,
                namespaceId: prefixId(namespaceId, 'namespace') as string,
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
                    AND namespace_id = {namespaceId:String}
            `;

            const receiveTrendsQuery = `
                SELECT
                    toDate(received_at) AS day,
                    COUNT() AS events
                FROM ingest_events
                WHERE toDate(received_at) >= today() - INTERVAL {days:Int32} days
                    AND workspace_id = {workspaceId:String}
                    AND namespace_id = {namespaceId:String}
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
                    AND namespace_id = {namespaceId:String}
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
                    AND namespace_id = {namespaceId:String}
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
                    AND namespace_id = {namespaceId:String}
                GROUP BY day
                ORDER BY day DESC;
            `;

            const [stats, receiveTrends, topSources, processStatusDistribution, failureTrends] =
                await Promise.all([
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
            const resultProcessStatusDistribution = await processStatusDistribution.json<{
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
                topSources: resultTopSources.length
                    ? resultTopSources.map((s: any) => ({
                          ...transformWithId(s, 'source'),
                          source: s.source || 'unknown',
                          total: Number(s.total),
                      }))
                    : [
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
        } catch (error: any) {
            logger.error('Failed to get stats ', error);
            throw error;
        }
    }
}
