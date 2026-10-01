import { eventRouter } from "./event.router";
import { eventDispatcher } from "../../app/event/event.dispatcher";
import { serviceHandlerRegistry } from "@/handlers/services";
import { WebhookType } from "@/types/events";
import { logger } from "@/utils";

/**
 * @title Route events Consumer
 * @description Specialized consumer for handling route webhook events
 * @description Routes events from JetStream and routes them to appropriate targets
 */
export class RouteConsumer {
    private isRunning = false;

    public async start(): Promise<void> {
        if (this.isRunning) {
            logger.debug("Route consumer already running");
            return;
        }

        try {
            logger.debug("🚀 Starting Route Consumer...");

            // Initialize service handlers
            await serviceHandlerRegistry.initializeDefaultHandlers();

            this.isRunning = true;
            logger.debug("✅ Route consumer started successfully");
        } catch (error) {
            console.error("❌ Failed to start route consumer:", error);
            throw error;
        }
    }

    /**
     * Process a route event from JetStream
     */
    public async processRouteEvent(messageData: any): Promise<void> {
        try {
            // TODO: Improve validate event structure
            if (!eventRouter.validateEvent(messageData)) {
                logger.debug("Invalid event structure, skipping");
                return;
            }

            // Check if this is a route webhook type
            if (
                !eventRouter.shouldProcessEvent(
                    messageData.webhookType,
                    WebhookType.FORWARD
                )
            ) {
                logger.debug(
                    `Skipping non-route event: ${messageData.webhookType}`
                );
                return;
            }

            logger.debug(`📨 Processing route event: ${messageData.eventId}`);

            // Route event to appropriate handler based on source
            await eventRouter.routeEvent(
                messageData,
                messageData.webhookType,
                messageData.targets
            );

            // Dispatch to targets
            await eventDispatcher.dispatchToTargets(
                messageData,
                messageData.webhookId,
                messageData.targets
            );

            logger.debug(`✅ Route event processed: ${messageData.eventId}`);
        } catch (error) {
            console.error("❌ Error processing route event:", error);
            throw error;
        }
    }

    public async stop(): Promise<void> {
        if (!this.isRunning) {
            return;
        }

        try {
            this.isRunning = false;
            logger.debug("👋 Route consumer stopped");
        } catch (error) {
            console.error("Error stopping route consumer:", error);
            throw error;
        }
    }

    public getStatus(): boolean {
        return this.isRunning;
    }
}

export const routeConsumer = new RouteConsumer();
