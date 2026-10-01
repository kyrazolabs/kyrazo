import { IServiceHandler, ServiceType } from "@/types/services";
import { WebhookType } from "@/types/events/event.types";
import { receiveProcessor } from "@/processors/receive.processor";

/**
 * @title Receive Event Handler
 * @description Handles receive events by validating signatures and storing in database
 */
export class ReceiveHandler implements IServiceHandler {
    serviceType = ServiceType.GENERAL; // Use GENERAL for receive events

    canHandle(eventType: string): boolean {
        // Receive handler is selected by the registry based on webhookType, not eventType
        // This method is kept for interface compatibility but not used for routing decisions
        return true;
    }

    async process(event: any, targets: any[]): Promise<void> {
        console.log(`ReceiveHandler processing event: ${event.eventType}`);

        // Delegate to receive processor for actual processing
        await receiveProcessor.processEvent(event);
    }
}

export const receiveHandler = new ReceiveHandler();
