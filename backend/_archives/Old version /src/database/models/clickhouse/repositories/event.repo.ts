import { clickhouseConfig } from '@/config';
import { logger } from '@/utils';

export class EventRepo {
    private static getClient() {
        return clickhouseConfig.getClient();
    }

    static async insert(table: string, data: any[]) {
        try {
            const client = this.getClient();
            if (!client) {
                logger.warn(`ClickHouse client not available, skipping insert to ${table}`);
                logger.debug(`Data that would be inserted:`, JSON.stringify(data, null, 2));
                return; // Silently skip if ClickHouse is not available
            }

            await client.insert({
                table: table,
                values: data,
                format: 'JSONEachRow'
            });

            logger.info(`Successfully inserted 1 record into ${table}`);
        } catch (error) {
            logger.error(`Failed to insert data into ${table}:`, error);
            logger.error(`Data that failed to insert:`, JSON.stringify(data, null, 2));
            // Don't throw error - allow the application to continue without ClickHouse
            logger.warn('Continuing without ClickHouse analytics storage');
        }
    }


    static async executeRaw(query: string, limit: number = 10) {
        try {
            const client = this.getClient();
            if (!client) {
                logger.warn('ClickHouse client not available, returning empty result for query');
                return [];
            }

            const rows = await client.query({
                query: query,
                format: 'JSONEachRow',
            });
            return await rows.json();
        } catch (error) {
            logger.error(`Failed to execute raw query: ${query}`, error);
            // Return empty array instead of throwing to allow graceful degradation
            logger.warn('Returning empty result due to ClickHouse query failure');
            return [];
        }
    }

    /**
     * Get pending events for processing
     */
    static async getPendingEvents(limit: number = 100): Promise<any[]> {
        try {
            const query = `
                SELECT * FROM webhooks_events 
                WHERE status = 'pending' 
                ORDER BY inserted_at ASC 
                LIMIT ${limit}
            `;

            return await this.executeRaw(query, limit);
        } catch (error) {
            logger.error('Failed to get pending events:', error);
            throw error;
        }
    }

    /**
     * Get webhook statistics
     */
    static async getStats(workspace_id?: string): Promise<any> {
        try {
            let query = `
                SELECT 
                    count() as total_events,
                    countIf(status = 'completed') as successful_deliveries,
                    countIf(status = 'failed') as failed_deliveries,
                    countIf(status = 'pending') as pending_deliveries,
                    avg(response_time_ms) as average_delivery_time
                FROM webhooks_events
            `;

            if (workspace_id) {
                query += ` WHERE workspace_id = '${workspace_id}'`;
            }

            const result = await this.executeRaw(query, 1);
            return result[0] || {};
        } catch (error) {
            logger.error('Failed to get stats:', error);
            throw error;
        }
    }
}