import { clickhouseConfig } from '@/config/clickhouse.config';
import { IDeliveryAttempt } from '@/types/services/index';
import { logger } from '@/utils';

/**
 * @title Delivery Repository
 * @description Handles all ClickHouse operations for delivery attempts
 */
export class DeliveryRepository {
  private static instance: DeliveryRepository;

  private constructor() {}

  public static getInstance(): DeliveryRepository {
    if (!DeliveryRepository.instance) {
      DeliveryRepository.instance = new DeliveryRepository();
    }
    return DeliveryRepository.instance;
  }

  private getClient() {
    return clickhouseConfig.getClient();
  }

  /**
   * @title Create delivery attempt record
   * @description Inserts a new delivery attempt into ClickHouse
   */
  public async createDeliveryAttempt(attempt: IDeliveryAttempt): Promise<void> {
    try {
      const client = this.getClient();

      // Map the attempt data to match ClickHouse schema
      const deliveryData = {
        delivery_id: attempt.deliveryId,
        workspace_id: attempt.workspaceId || 'default', // Now properly passed from caller
        producer_id: attempt.producerId || 'worker-delivery-handler', // Now properly passed from caller
        webhook_type: attempt.webhookType || 'publish', // Now properly passed from caller

        event_id: attempt.eventId,
        webhook_id: attempt.webhookId || '', // Now properly passed from caller
        endpoint_id: null, // Not in interface
        target: attempt.target || '', // Now properly passed from caller

        status: this.mapStatusToEnum(attempt.status),
        attempt_number: attempt.attemptNumber,

        request_header: JSON.stringify(attempt.requestHeaders || {}),
        request_body: attempt.requestBody || '',

        response_code: attempt.responseCode || null,
        response_header: JSON.stringify(attempt.responseHeaders || {}),
        response_body: attempt.responseBody || '',
        response_time_ms: attempt.responseTimeMs || null,

        scheduled_at: this.formatDateForClickHouse(attempt.scheduledAt),
        processed_at: attempt.processedAt ? this.formatDateForClickHouse(attempt.processedAt) : null,

        error: attempt.error || null,
      };

      await client.insert({
        table: 'delivery_attempts',
        values: [deliveryData],
        format: 'JSONEachRow'
      });

      logger.info(`✅ Delivery attempt created: ${attempt.deliveryId} for target ${attempt.targetId}`);
    } catch (error) {
      logger.error("❌ Error creating delivery attempt:", error);
      throw error;
    }
  }

  /**
   * @title Update delivery attempt status
   * @description Updates an existing delivery attempt in ClickHouse
   */
  public async updateDeliveryAttempt(
    deliveryId: string,
    updates: Partial<IDeliveryAttempt>
  ): Promise<void> {
    try {
      const client = this.getClient();

      // Build dynamic UPDATE query based on provided updates
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (updates.status) {
        updateFields.push('status = {status:UInt8}');
        updateValues.push({ status: this.mapStatusToEnum(updates.status) });
      }

      if (updates.responseCode !== undefined) {
        updateFields.push('response_code = {responseCode:UInt16}');
        updateValues.push({ responseCode: updates.responseCode });
      }

      if (updates.responseBody !== undefined) {
        updateFields.push('response_body = {responseBody:String}');
        updateValues.push({ responseBody: updates.responseBody });
      }

      if (updates.responseHeaders) {
        updateFields.push('response_header = {responseHeaders:String}');
        updateValues.push({ responseHeaders: JSON.stringify(updates.responseHeaders) });
      }

      if (updates.responseTimeMs !== undefined) {
        updateFields.push('response_time_ms = {responseTimeMs:UInt32}');
        updateValues.push({ responseTimeMs: updates.responseTimeMs });
      }

      if (updates.processedAt) {
        updateFields.push('processed_at = {processedAt:String}');
        updateValues.push({ processedAt: this.formatDateForClickHouse(updates.processedAt) });
      }

      if (updates.error !== undefined) {
        updateFields.push('error = {error:String}');
        updateValues.push({ error: updates.error });
      }

      if (updates.attemptNumber !== undefined) {
        updateFields.push('attempt_number = {attemptNumber:UInt16}');
        updateValues.push({ attemptNumber: updates.attemptNumber });
      }

      if (updateFields.length === 0) {
        logger.warn('No fields to update for delivery attempt:', deliveryId);
        return;
      }

      // Flatten update values for parameterized query
      const params: Record<string, any> = {};
      updateValues.forEach((value, index) => {
        Object.assign(params, value);
      });

      const query = `
        ALTER TABLE delivery_attempts UPDATE
        ${updateFields.join(', ')}
        WHERE delivery_id = {deliveryId:String}
      `;

      await client.query({
        query,
        query_params: { ...params, deliveryId }
      });

      logger.debug(`✅ Updated delivery attempt: ${deliveryId}`);
    } catch (error) {
      logger.error("❌ Error updating delivery attempt:", error);
      throw error;
    }
  }

  /**
   * @title Get delivery attempts by event ID
   * @description Retrieves all delivery attempts for a specific event
   */
  public async getDeliveryAttemptsByEventId(
    eventId: string
  ): Promise<IDeliveryAttempt[]> {
    try {
      const client = this.getClient();

      const query = `
        SELECT * FROM delivery_attempts
        WHERE event_id = {eventId:String}
        ORDER BY attempt_number ASC
      `;

      const result = await client.query({
        query,
        query_params: { eventId },
        format: 'JSONEachRow'
      });

      const rows = await result.json() as any[];

      // Map ClickHouse data back to IDeliveryAttempt format
      const attempts: IDeliveryAttempt[] = rows.map(row => {
        const statusValue = this.mapEnumToStatus(row.status);
        return {
          deliveryId: row.delivery_id,
          targetId: row.target_id || '',
          eventId: row.event_id,
          status: statusValue as 'pending' | 'processing' | 'delivered' | 'failed',
          attemptNumber: row.attempt_number,
          requestHeaders: JSON.parse(row.request_header || '{}'),
          requestBody: row.request_body,
          responseCode: row.response_code,
          responseHeaders: JSON.parse(row.response_header || '{}'),
          responseBody: row.response_body,
          responseTimeMs: row.response_time_ms,
          scheduledAt: new Date(row.scheduled_at),
          processedAt: row.processed_at ? new Date(row.processed_at) : undefined,
          error: row.error,
        };
      });

      logger.debug(`✅ Retrieved ${attempts.length} delivery attempts for event: ${eventId}`);
      return attempts;
    } catch (error) {
      logger.error("❌ Error getting delivery attempts:", error);
      throw error;
    }
  }

  /**
   * @title Get failed delivery attempts for retry
   * @description Retrieves failed delivery attempts that are eligible for retry
   */
  public async getFailedAttemptsForRetry(
    maxRetries: number = 3
  ): Promise<IDeliveryAttempt[]> {
    try {
      const client = this.getClient();

      const query = `
        SELECT * FROM delivery_attempts
        WHERE status IN ('failed', 'timeout', 'network_error')
        AND attempt_number < {maxRetries:UInt16}
        ORDER BY scheduled_at ASC
        LIMIT 100
      `;

      const result = await client.query({
        query,
        query_params: { maxRetries },
        format: 'JSONEachRow'
      });

      const rows = await result.json() as any[];

      // Map ClickHouse data back to IDeliveryAttempt format
      const attempts: IDeliveryAttempt[] = rows.map(row => {
        const statusValue = this.mapEnumToStatus(row.status);
        return {
          deliveryId: row.delivery_id,
          targetId: row.target_id || '',
          eventId: row.event_id,
          status: statusValue as 'pending' | 'processing' | 'delivered' | 'failed',
          attemptNumber: row.attempt_number,
          requestHeaders: JSON.parse(row.request_header || '{}'),
          requestBody: row.request_body,
          responseCode: row.response_code,
          responseHeaders: JSON.parse(row.response_header || '{}'),
          responseBody: row.response_body,
          responseTimeMs: row.response_time_ms,
          scheduledAt: new Date(row.scheduled_at),
          processedAt: row.processed_at ? new Date(row.processed_at) : undefined,
          error: row.error,
        };
      });

      logger.debug(`✅ Retrieved ${attempts.length} failed attempts for retry (max retries: ${maxRetries})`);
      return attempts;
    } catch (error) {
      logger.error("❌ Error getting failed attempts:", error);
      throw error;
    }
  }

  /**
   * @title Mark delivery as successful
   * @description Updates delivery attempt with success information
   */
  public async markDeliverySuccess(
    deliveryId: string,
    responseCode: number,
    responseBody: string
  ): Promise<void> {
    try {
      await this.updateDeliveryAttempt(deliveryId, {
        status: "delivered",
        responseCode,
        responseBody,
        processedAt: new Date(),
      });
      logger.info(`✅ Delivery ${deliveryId} marked as successful (${responseCode})`);
    } catch (error) {
      logger.error("❌ Error marking delivery as success:", error);
      throw error;
    }
  }

  /**
   * @title Mark delivery as failed
   * @description Updates delivery attempt with failure information
   */
  public async markDeliveryFailed(
    deliveryId: string,
    error: string,
    attemptNumber: number
  ): Promise<void> {
    try {
      await this.updateDeliveryAttempt(deliveryId, {
        status: "failed",
        error,
        attemptNumber,
      });
      logger.info(`❌ Delivery ${deliveryId} marked as failed: ${error}`);
    } catch (error) {
      logger.error("❌ Error marking delivery as failed:", error);
      throw error;
    }
  }

  /**
   * @title Get delivery statistics
   * @description Retrieves delivery statistics for monitoring
   */
  public async getDeliveryStats(workspaceId?: string): Promise<{
    total: number;
    successful: number;
    failed: number;
    pending: number;
    averageResponseTime: number;
  }> {
    try {
      const client = this.getClient();

      let query = `
        SELECT
          count() as total,
          countIf(status = 3) as successful, -- delivered
          countIf(status = 4) as failed, -- failed
          countIf(status = 1) as pending, -- pending
          avg(response_time_ms) as average_response_time
        FROM delivery_attempts
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
      const stats = rows[0] || { total: 0, successful: 0, failed: 0, pending: 0, average_response_time: 0 };

      return {
        total: Number(stats.total),
        successful: Number(stats.successful),
        failed: Number(stats.failed),
        pending: Number(stats.pending),
        averageResponseTime: Number(stats.average_response_time || 0),
      };
    } catch (error) {
      logger.error("❌ Error getting delivery stats:", error);
      throw error;
    }
  }

  /**
   * @title Map status string to ClickHouse enum value
   */
  private mapStatusToEnum(status: string): number {
    const statusMap: Record<string, number> = {
      'pending': 1,
      'processing': 2,
      'delivered': 3,
      'failed': 4,
      'timeout': 5,
      'network_error': 6,
    };
    return statusMap[status] || 1; // Default to pending
  }

  /**
   * @title Map ClickHouse enum value to status string
   */
  private mapEnumToStatus(enumValue: number): string {
    const enumMap: Record<number, string> = {
      1: 'pending',
      2: 'processing',
      3: 'delivered',
      4: 'failed',
      5: 'timeout',
      6: 'network_error',
    };
    return enumMap[enumValue] || 'pending';
  }

  /**
   * @title Format date for ClickHouse DateTime64(3)
   * @description Formats a JavaScript Date object to ClickHouse-compatible format
   */
  private formatDateForClickHouse(date: Date): string {
    return date.toISOString().slice(0, 23).replace('T', ' ');
  }
}

export const deliveryRepository = DeliveryRepository.getInstance();