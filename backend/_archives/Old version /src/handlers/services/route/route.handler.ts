import { IServiceHandler, ServiceType } from "@/types/services";
import { routeProcessor } from "@/processors/route.processor";
import { WebhookType } from "@/types/events/event.types";

/**
 * @title Route Event Handler
 * @description Handles route events by getting targets and dispatching to them
 */
export class RouteHandler implements IServiceHandler {
    serviceType = ServiceType.ROUTE as ServiceType;

    canHandle(eventType: string): boolean {
        // Route handler is selected by the registry based on webhookType, not eventType
        // This method is kept for interface compatibility but not used for routing decisions
        return true;
    }

    async process(event: any, targets: any[]): Promise<void> {
        console.log(
            `RouteHandler processing event: ${event.eventId} (webhookType: ${event.webhookType})`
        );

        await routeProcessor.processEvent(event, targets);
    }
}

export const routeHandler = new RouteHandler();
