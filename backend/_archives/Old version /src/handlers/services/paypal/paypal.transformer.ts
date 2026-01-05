import { logger } from '@/utils';

/**
 * @title PayPal Event Transformer
 * @description Transforms PayPal webhook events for internal processing
 */
export class PayPalTransformer {
  private static instance: PayPalTransformer;

  private constructor() {}

  public static getInstance(): PayPalTransformer {
    if (!PayPalTransformer.instance) {
      PayPalTransformer.instance = new PayPalTransformer();
    }
    return PayPalTransformer.instance;
  }

  /**
   * Transform PayPal event for storage
   */
  public transformForStorage(paypalEvent: any): any {
    try {
      // PayPal event structure: eventData.body contains the actual PayPal event
      const paypalBody = paypalEvent.body;

      return {
        eventId: paypalBody.id,
        eventType: paypalBody.event_type,
        source: 'paypal',
        timestamp: new Date(paypalBody.create_time || Date.now()),
        data: {
          resource: paypalBody.resource,
          resource_type: paypalBody.resource_type,
          event_version: paypalBody.event_version,
          summary: paypalBody.summary,
        },
        // Preserve original event for debugging
        raw: paypalBody,
      };
    } catch (error) {
      logger.error('Error transforming PayPal event for storage:', error);
      throw error;
    }
  }

  /**
   * Transform PayPal event for target delivery
   */
  public transformForTarget(paypalEvent: any, targetService: string): any {
    try {
      // Transform based on target service requirements
      switch (targetService) {
        case 'endpoint':
          return this.transformForEndpointTarget(paypalEvent);
        case 'webhook':
          return this.transformForWebhookTarget(paypalEvent);
        case 'database':
          return this.transformForDatabaseTarget(paypalEvent);
        default:
          return this.transformForGenericTarget(paypalEvent);
      }
    } catch (error) {
      logger.error('Error transforming PayPal event for target:', error);
      throw error;
    }
  }

  /**
   * Transform for webhook target delivery
   */
  private transformForWebhookTarget(paypalEvent: any): any {
    // PayPal event structure: eventData.body contains the actual PayPal event
    const paypalBody = paypalEvent.body;

    return {
      event_id: paypalBody.id,
      event_type: paypalBody.event_type,
      timestamp: paypalBody.create_time,
      resource: paypalBody.resource,
      resource_type: paypalBody.resource_type,
      summary: paypalBody.summary,
      // Add PayPal-specific metadata
      source: 'paypal',
      verified: true,
    };
  }

  /**
   * Transform for database target
   */
  private transformForDatabaseTarget(paypalEvent: any): any {
    // PayPal event structure: eventData.body contains the actual PayPal event
    const paypalBody = paypalEvent.body;

    return {
      id: paypalBody.id,
      type: paypalBody.event_type,
      data: paypalBody.resource,
      metadata: {
        source: 'paypal',
        timestamp: paypalBody.create_time,
        version: paypalBody.event_version,
      },
    };
  }

  /**
   * Transform for generic target
   */
  private transformForGenericTarget(paypalEvent: any): any {
    // PayPal event structure: eventData.body contains the actual PayPal event
    const paypalBody = paypalEvent.body;

    return {
      id: paypalBody.id,
      type: paypalBody.event_type,
      data: paypalBody.resource,
      source: 'paypal',
      timestamp: paypalBody.create_time,
    };
  }

  /**
   * Transform for endpoint target (removes PayPal-specific headers)
   */
  private transformForEndpointTarget(paypalEvent: any): any {
    // PayPal event structure: eventData.body contains the actual PayPal event
    const paypalBody = paypalEvent.body;

    return {
      event_id: paypalBody.id,
      event_type: paypalBody.event_type,
      timestamp: paypalBody.create_time,
      resource: paypalBody.resource,
      resource_type: paypalBody.resource_type,
      summary: paypalBody.summary,
      // Clean data for external endpoints
      source: 'paypal',
      verified: true,
    };
  }

  /**
   * Extract PayPal event type for routing
   */
  public extractEventType(paypalEvent: any): string {
    // PayPal event structure: eventData.body contains the actual PayPal event
    const paypalBody = paypalEvent.body;
    return paypalBody?.event_type || 'paypal.unknown';
  }

  /**
   * Extract PayPal resource ID for tracking
   */
  public extractResourceId(paypalEvent: any): string {
    // PayPal event structure: eventData.body contains the actual PayPal event
    const paypalBody = paypalEvent.body;

    if (paypalBody?.resource?.id) {
      return paypalBody.resource.id;
    }
    if (paypalBody?.resource?.order_id) {
      return paypalBody.resource.order_id;
    }
    if (paypalBody?.resource?.payment_id) {
      return paypalBody.resource.payment_id;
    }
    return paypalBody?.id || 'unknown';
  }

  /**
   * Validate PayPal event structure
   */
  public validateEventStructure(paypalEvent: any): boolean {
    if (!paypalEvent) {
      logger.warn('PayPal event is null or undefined');
      return false;
    }

    if (!paypalEvent.id) {
      logger.warn('PayPal event missing id');
      return false;
    }

    if (!paypalEvent.event_type) {
      logger.warn('PayPal event missing event_type');
      return false;
    }

    if (!paypalEvent.resource) {
      logger.warn('PayPal event missing resource');
      return false;
    }

    return true;
  }
}

export const paypalTransformer = PayPalTransformer.getInstance();