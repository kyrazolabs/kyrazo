import { logger } from '@/utils';

/**
 * @title General Event Transformer
 * @description Basic transformer for general events with minimal processing requirements
 */
export class GeneralTransformer {
  private static instance: GeneralTransformer;

  private constructor() {}

  public static getInstance(): GeneralTransformer {
    if (!GeneralTransformer.instance) {
      GeneralTransformer.instance = new GeneralTransformer();
    }
    return GeneralTransformer.instance;
  }

  /**
   * @title Transform event for storage
   * @description Basic transformation for general events
   */
  public transformForStorage(event: any): any {
    try {
      logger.debug(`General transformer: Transforming event for storage: ${event.eventId}`);

      return {
        eventId: event.eventId,
        source: event.source || 'general',
        eventType: event.eventType || 'general.default',
        data: event.body || event.data || {},
        headers: event.headers || {},
        timestamp: event.timestamp || Date.now(),
        metadata: {
          originalEventType: event.eventType,
          source: event.source,
          webhookType: event.webhookType,
          transformedAt: new Date(),
        }
      };
    } catch (error) {
      logger.error('General transformer: Error transforming event for storage:', error);
      throw error;
    }
  }

  /**
   * @title Transform event for target delivery
   * @description Transform general event for delivery to external targets
   */
  public transformForTarget(event: any, targetType: string): any {
    try {
      logger.debug(`General transformer: Transforming event for target delivery: ${event.eventId}`);

      const basePayload = {
        eventId: event.eventId,
        source: event.source || 'general',
        eventType: event.eventType || 'general.default',
        timestamp: Date.now(),
        data: event.body || event.data || {},
      };

      // Add target-specific transformations
      switch (targetType) {
        case 'endpoint':
          return {
            ...basePayload,
            webhookType: 'publish',
            headers: this.createDeliveryHeaders(event),
          };

        case 'webhook':
          return {
            ...basePayload,
            webhookType: 'forward',
            targetUrl: event.targetUrl,
          };

        default:
          return basePayload;
      }
    } catch (error) {
      logger.error('General transformer: Error transforming event for target:', error);
      throw error;
    }
  }

  /**
   * @title Create delivery headers for general events
   * @description Create standard headers for event delivery
   */
  private createDeliveryHeaders(event: any): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'User-Agent': 'Hookify-Worker/1.0',
      'X-Event-ID': event.eventId,
      'X-Source': event.source || 'general',
      'X-Event-Type': event.eventType || 'general.default',
      'X-Timestamp': Date.now().toString(),
      'X-Webhook-Type': event.webhookType || 'general',
    };
  }

  /**
   * @title Transform event for database storage
   * @description Prepare event data for ClickHouse storage
   */
  public transformForDatabase(event: any): any {
    try {
      logger.debug(`General transformer: Transforming event for database: ${event.eventId}`);

      return {
        event_id: event.eventId,
        source: event.source || 'general',
        workspace_id: event.workspaceId || 'default',
        webhook_id: event.webhookId || '',
        ingress_id: event.ingressId || `general_${Date.now()}`,
        user_id: event.userId || '',

        received_at: event.receivedAt ? new Date(event.receivedAt) : new Date(),
        headers: event.headers || {},
        body: event.body || event.data || {},
        processing_status: 'processed', // General events are always considered processed
        verified: true, // General events skip verification
        processing_error: null,

        route_to: event.routeTo || null,
        route_to_meta: event.routeToMeta || null,
      };
    } catch (error) {
      logger.error('General transformer: Error transforming event for database:', error);
      throw error;
    }
  }

  /**
   * @title Validate and normalize event data
   * @description Basic normalization for general events
   */
  public normalizeEvent(event: any): any {
    try {
      const normalized = {
        ...event,
        source: event.source || 'general',
        eventType: event.eventType || 'general.default',
        body: event.body || event.data || {},
        headers: event.headers || {},
        timestamp: event.timestamp || Date.now(),
      };

      logger.debug(`General transformer: Normalized event: ${event.eventId}`);
      return normalized;
    } catch (error) {
      logger.error('General transformer: Error normalizing event:', error);
      throw error;
    }
  }
}

export const generalTransformer = GeneralTransformer.getInstance();