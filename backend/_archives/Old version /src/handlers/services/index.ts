import { IServiceHandler, ServiceType } from '@/types/services';
import { WebhookType } from '@/types/events/event.types';
import { receiveHandler } from './receive/receive.handler';
import { routeHandler } from './route/route.handler';
import { paypalHandler } from './paypal/paypal.handler';
import { externalHandler } from './external/external.handler';

/**
 * Service Handler Registry
 * Manages all service handlers for different external services
 */
export class ServiceHandlerRegistry {
  private static instance: ServiceHandlerRegistry;
  private handlers: Map<ServiceType, IServiceHandler> = new Map();

  private constructor() {}

  public static getInstance(): ServiceHandlerRegistry {
    if (!ServiceHandlerRegistry.instance) {
      ServiceHandlerRegistry.instance = new ServiceHandlerRegistry();
    }
    return ServiceHandlerRegistry.instance;
  }

  /**
   * Register a service handler
   */
  public registerHandler(handler: IServiceHandler): void {
    this.handlers.set(handler.serviceType, handler);
    console.log(`Registered handler for service: ${handler.serviceType}`);
  }

  /**
   * Get handler for a specific service type
   */
  public getHandler(serviceType: ServiceType): IServiceHandler | undefined {
    return this.handlers.get(serviceType);
  }

  /**
   * Get all registered handlers
   */
  public getAllHandlers(): IServiceHandler[] {
    return Array.from(this.handlers.values());
  }

  /**
   * Find appropriate handler for an event based on webhookType and source
   */
  public findHandler(event: any): IServiceHandler | undefined {
    const handlers = Array.from(this.handlers.values());
    const source = event.source || 'external';

    for (const handler of handlers) {
      // Check if handler can handle this event based on source and webhookType
      if (this.canHandlerProcessEvent(handler, event)) {
        return handler;
      }
    }
    return undefined;
  }

  /**
   * Check if a handler can process a specific event
   */
  private canHandlerProcessEvent(handler: IServiceHandler, event: any): boolean {
    const source = event.source || 'external';
    const webhookType = event.webhookType;

    // Route events (webhookType = 'forward') go to route handler
    if (webhookType === 'forward') {
      return handler.serviceType === 'route';
    }

    // Receive events (webhookType = 'receive') go to source-specific handlers
    if (webhookType === 'receive') {
      switch (source.toLowerCase()) {
        case 'paypal':
          return handler.serviceType === 'paypal';
        // case 'stripe':
        //   return handler.serviceType === 'stripe';
        // case 'github':
        //   return handler.serviceType === 'github';
        // case 'shopify':
        //   return handler.serviceType === 'shopify';
        default:
          // For unknown sources, use general handler ONLY for receive events
          return handler.serviceType === 'general';
      }
    }

    // Publish events (webhookType = 'publish') should NOT go to general handler
    // They are handled by the publish consumer directly
    if (webhookType === 'publish') {
      return false; // Never route publish events to service handlers
    }

    return false;
  }

  /**
   * Check if a handler exists for a service type
   */
  public hasHandler(serviceType: ServiceType): boolean {
    return this.handlers.has(serviceType);
  }

  /**
   * Route event to appropriate handler based on webhookType and source
   */
  public async routeEvent(
    event: any,
    webhookType: WebhookType,
    targets: any[]
  ): Promise<void> {
    try {
      const source = event.source || 'external';
      console.log(`Routing event: ${event.eventId} (${webhookType}) from source: ${source}`);

      // Find appropriate handler based on source and webhookType
      const handler = this.findHandler(event);

      if (handler) {
        console.log(`Routing ${event.eventId} event to ${handler.serviceType} handler`);
        await handler.process(event, targets);
      } else {
        console.log(`No handler found for event: ${event.eventId} from source: ${source}`);
        // Use external handler as fallback for unsupported services
        const externalHandler = serviceHandlerRegistry.getHandler('general' as any);
        if (externalHandler) {
          await externalHandler.process(event, []);
        }
      }
    } catch (error) {
      console.error('Error routing event:', error);
      throw error;
    }
  }

  /**
   * Handle events that don't have a specific handler
   */
  private async handleUnhandledEvent(event: any, targets: any[]): Promise<void> {
    console.log(`Handling unhandled event type: ${event.eventType}`);

    // For now, just log the event
    // In the future, this could use a general handler
    console.log('Unhandled event details:', {
      eventId: event.eventId,
      eventType: event.eventType,
      targetsCount: targets.length,
      data: event.data
    });
  }

  /**
   * Initialize default handlers
   */
  public async initializeDefaultHandlers(): Promise<void> {
    console.log('Initializing default service handlers...');

    // Register PayPal handler for PayPal-specific events
    this.registerHandler(paypalHandler);

    // Register receive handler
    this.registerHandler(receiveHandler);

    // Register route handler
    this.registerHandler(routeHandler);

    // Register external handler for unhandled events (no signature verification required)
    this.registerHandler(externalHandler);

    console.log('Default handlers initialized (paypal, receive, route, external)');
  }
}

export const serviceHandlerRegistry = ServiceHandlerRegistry.getInstance();