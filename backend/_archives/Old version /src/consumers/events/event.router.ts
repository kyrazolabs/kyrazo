import { WebhookType } from "@/types/events";
import { serviceHandlerRegistry } from "@/handlers/services";

/**
 * Event Router
 * Routes events to appropriate service handlers based on webhook type and event type
 */
export class EventRouter {
  private static instance: EventRouter;

  private constructor() {}

  public static getInstance(): EventRouter {
    if (!EventRouter.instance) {
      EventRouter.instance = new EventRouter();
    }
    return EventRouter.instance;
  }

  /**
   * Route an event to the appropriate handler based on webhookType and source
   */
  public async routeEvent(
    event: any,
    webhookType: WebhookType,
    targets: any[]
  ): Promise<void> {
    try {
      const source = event.source || 'external';
      console.log(`Routing event: ${event.eventId} (${webhookType}) from source: ${source}`);

      // Route to service handler registry
      await serviceHandlerRegistry.routeEvent(event, webhookType, targets);
    } catch (error) {
      console.error("Error routing event:", error);
      throw error;
    }
  }

  /**
   * @title Check if event should be processed based on webhook type
   * @param webhookType The type to be compared to the type required
   * @param requiredType The type to be compared
   */
  public shouldProcessEvent(
    webhookType: WebhookType,
    requiredType?: WebhookType
  ): boolean {
    // If no required type specified, process all types
    if (!requiredType) {
      return true;
    }

    // For backward compatibility, exact match
    if (webhookType === requiredType) {
      return true;
    }

    // For receive events, also accept any event type starting with 'receive.'
    if (requiredType === WebhookType.RECEIVE && webhookType.toString().startsWith('receive.')) {
      return true;
    }

    // For route events, also accept any event type starting with 'route.'
    if (requiredType === WebhookType.FORWARD && webhookType.toString().startsWith('route.')) {
      return true;
    }

    return false;
  }

  /**
   * Validate event structure
   */
  public validateEvent(event: any): boolean {
    if (!event) {
      console.log("Event is null or undefined");
      return false;
    }

    if (!event.eventId) {
      console.log("Event missing eventId");
      return false;
    }

    if (event.webhookType === 'publish') {
      if (!event.eventType) {
        console.log("Event missing eventType");
        return false;
      }
      if (!event.data) {
        console.log("Event missing data");
        return false;
      }
    }

    if (event.webhookType === "receive") {
      if (!event.headers) {
        console.log("Event missing header");
        return false;
      }
      if (!event.body) {
        console.log("Event missing body");
        return false;
      }
    }


    return true;
  }

  /**
   * Validate targets
   */
  public validateTargets(targets: any[]): boolean {
    if (!Array.isArray(targets)) {
      console.log("Targets is not an array");
      return false;
    }

    if (targets.length === 0) {
      console.log("No targets provided");
      return false;
    }

    // Check if at least one target has a valid URL
    const validTargets = targets.filter((target) => target && target.targetUrl);
    if (validTargets.length === 0) {
      console.log("No valid targets with URLs");
      return false;
    }

    return true;
  }
}

export const eventRouter = EventRouter.getInstance();
