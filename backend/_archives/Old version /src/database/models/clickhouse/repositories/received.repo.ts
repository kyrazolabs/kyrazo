import { clickhouseConfig } from '@/config/clickhouse.config';
import { IReceivedEvent, ProcessingStatus } from '@/types/events/event.types';
import { logger } from '@/utils';

/**
 * @title Received Event Repository
 * @description Handles all ClickHouse operations for received events
 */
export class ReceivedEventRepository {
  private static instance: ReceivedEventRepository;

  private constructor() {}

  public static getInstance(): ReceivedEventRepository {
    if (!ReceivedEventRepository.instance) {
      ReceivedEventRepository.instance = new ReceivedEventRepository();
    }
    return ReceivedEventRepository.instance;
  }

  private getClient() {
    return clickhouseConfig.getClient();
  }

  /**
   * Initialize repository (connect to ClickHouse)
   */
  public async initialize(): Promise<void> {
    try {
      await clickhouseConfig.connect();
      logger.debug('✅ ReceivedEventRepository initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize ReceivedEventRepository:', error);
      throw error;
    }
  }

  /**
   * @title Save received event
   * @description Stores a received event in ClickHouse
   */
  public async saveReceivedEvent(event: IReceivedEvent): Promise<void> {
    try {
      const client = this.getClient();

      // Map IReceivedEvent to ClickHouse schema
      const eventData = {
        event_id: event.eventId,
        webhook_id: event.webhookId,
        source: event.source,
        workspace_id: event.workspaceId,
        received_at: this.formatDateForClickHouse(event.receivedAt),
        headers: this.mapHeadersToString(event.headers),
        body: JSON.stringify(event.body),
        processing_status: this.mapProcessingStatusToEnum(event.processingStatus),
        verified: event.verified ? 1 : 0,
        processing_error: event.processingError || null,
        associated_event_id: event.associatedEventId || null,
        user_id: event.userId || '',
        ingress_id: event.ingressId,
        created_at: this.formatDateForClickHouse(new Date()),
        updated_at: this.formatDateForClickHouse(new Date()),
      };

      await client.insert({
        table: 'received_events',
        values: [eventData],
        format: 'JSONEachRow'
      });

      logger.info(`✅ Received event saved: ${event.eventId} (verified: ${event.verified})`);
    } catch (error) {
      logger.error("❌ Error saving received event:", error);
      throw error;
    }
  }

  /**
   * @title Get received event by ID
   */
  public async getReceivedEvent(eventId: string): Promise<IReceivedEvent | null> {
    try {
      const client = this.getClient();

      const query = `
        SELECT * FROM received_events
        WHERE event_id = {eventId:String}
        LIMIT 1
      `;

      const result = await client.query({
        query,
        query_params: { eventId },
        format: 'JSONEachRow'
      });

      const rows = await result.json() as any[];

      if (rows.length === 0) {
        return null;
      }

      const row = rows[0];
      return this.mapFromDatabase(row);
    } catch (error) {
      logger.error("❌ Error getting received event:", error);
      throw error;
    }
  }

  /**
   * @title Get received events by webhook ID
   */
  public async getReceivedEventsByWebhookId(
    webhookId: string,
    limit: number = 100
  ): Promise<IReceivedEvent[]> {
    try {
      const client = this.getClient();

      const query = `
        SELECT * FROM received_events
        WHERE webhook_id = {webhookId:String}
        ORDER BY received_at DESC
        LIMIT {limit:UInt32}
      `;

      const result = await client.query({
        query,
        query_params: { webhookId, limit },
        format: 'JSONEachRow'
      });

      const rows = await result.json() as any[];
      return rows.map(row => this.mapFromDatabase(row));
    } catch (error) {
      logger.error("❌ Error getting received events by webhook:", error);
      throw error;
    }
  }

  /**
   * @title Update processing status
   */
  public async updateProcessingStatus(
    eventId: string,
    status: ProcessingStatus,
    error?: string
  ): Promise<void> {
    try {
      const client = this.getClient();

      const updateFields: string[] = ['processing_status = {status:UInt8}'];
      const params: Record<string, any> = {
        status: this.mapProcessingStatusToEnum(status)
      };

      if (error) {
        updateFields.push('processing_error = {error:String}');
        params.error = error;
      }

      updateFields.push('updated_at = {updatedAt:DateTime64}');
      params.updatedAt = new Date();

      const query = `
        ALTER TABLE received_events UPDATE
        ${updateFields.join(', ')}
        WHERE event_id = {eventId:String}
      `;

      await client.query({
        query,
        query_params: { ...params, eventId }
      });

      logger.debug(`✅ Updated processing status for event: ${eventId} -> ${status}`);
    } catch (error) {
      logger.error("❌ Error updating processing status:", error);
      throw error;
    }
  }

  /**
   * @title Get unprocessed events
   */
  public async getUnprocessedEvents(limit: number = 50): Promise<IReceivedEvent[]> {
    try {
      const client = this.getClient();

      const query = `
        SELECT * FROM received_events
        WHERE processing_status = {pendingStatus:UInt8}
        ORDER BY received_at ASC
        LIMIT {limit:UInt32}
      `;

      const result = await client.query({
        query,
        query_params: {
          pendingStatus: this.mapProcessingStatusToEnum(ProcessingStatus.PENDING),
          limit
        },
        format: 'JSONEachRow'
      });

      const rows = await result.json() as any[];
      return rows.map(row => this.mapFromDatabase(row));
    } catch (error) {
      logger.error("❌ Error getting unprocessed events:", error);
      throw error;
    }
  }

  /**
   * @title Get received events statistics
   */
  public async getReceivedEventsStats(workspaceId?: string): Promise<{
    total: number;
    verified: number;
    unverified: number;
    processed: number;
    failed: number;
  }> {
    try {
      const client = this.getClient();

      let query = `
        SELECT
          count() as total,
          countIf(verified = 1) as verified,
          countIf(verified = 0) as unverified,
          countIf(processing_status = 2) as processed,
          countIf(processing_status = 3) as failed
        FROM received_events
      `;

      const params: Record<string, any> = {};

      if (workspaceId) {
        query += ` WHERE workspace_id = {workspaceId:String}`;
        params.workspaceId = workspaceId;
      }

      const result = await client.query({
        query,
        query_params: params,
        format: 'JSONEachRow'
      });

      const rows = await result.json() as any[];
      const stats = rows[0] || { total: 0, verified: 0, unverified: 0, processed: 0, failed: 0 };

      return {
        total: Number(stats.total),
        verified: Number(stats.verified),
        unverified: Number(stats.unverified),
        processed: Number(stats.processed),
        failed: Number(stats.failed),
      };
    } catch (error) {
      logger.error("❌ Error getting received events stats:", error);
      throw error;
    }
  }

  /**
    * @title Map ProcessingStatus to ClickHouse enum
    */
   private mapProcessingStatusToEnum(status: ProcessingStatus): number {
     const statusMap: Record<ProcessingStatus, number> = {
       [ProcessingStatus.PENDING]: 1,
       [ProcessingStatus.PROCESSED]: 2,
       [ProcessingStatus.FAILED]: 3,
     };
     return statusMap[status] || 1;
   }

   /**
    * @title Format date for ClickHouse DateTime64(3)
    * @description Formats a JavaScript Date object to ClickHouse-compatible format
    */
   private formatDateForClickHouse(date: Date): string {
     return date.toISOString().slice(0, 23).replace('T', ' ');
   }

  /**
   * @title Map ClickHouse enum to ProcessingStatus
   */
  private mapEnumToProcessingStatus(enumValue: number): ProcessingStatus {
    const enumMap: Record<number, ProcessingStatus> = {
      1: ProcessingStatus.PENDING,
      2: ProcessingStatus.PROCESSED,
      3: ProcessingStatus.FAILED,
    };
    return enumMap[enumValue] || ProcessingStatus.PENDING;
  }

  /**
   * @title Map headers Map to string for storage
   */
  private mapHeadersToString(headers: Map<string, string>): string {
    try {
      const obj: Record<string, string> = {};
      headers.forEach((value, key) => {
        obj[key] = value;
      });
      return JSON.stringify(obj);
    } catch (error) {
      logger.error('Error mapping headers to string:', error);
      return '{}';
    }
  }

  /**
   * @title Map database row to IReceivedEvent
   */
  private mapFromDatabase(row: any): IReceivedEvent {
    const headersObj = JSON.parse(row.headers || '{}');
    const headersMap = new Map<string, string>();
    Object.entries(headersObj).forEach(([key, value]) => {
      headersMap.set(key, String(value));
    });

    return {
      eventId: row.event_id,
      source: row.source,
      workspaceId: row.workspace_id,
      webhookId: row.webhook_id,
      ingressId: row.ingress_id,
      userId: row.user_id,

      receivedAt: new Date(row.received_at),
      headers: headersMap,
      body: JSON.parse(row.body || 'null'),
      processingStatus: this.mapEnumToProcessingStatus(row.processing_status),
      verified: row.verified === 1,
      processingError: row.processing_error,

      routeTo: row.route_to,
      routeToMeta: row.route_to_meta ? JSON.parse(row.route_to_meta) : undefined,
    };
  }
}

export const receivedEventRepository = ReceivedEventRepository.getInstance();