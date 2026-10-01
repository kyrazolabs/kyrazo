import { eventRouter } from "./event.router";
import { serviceHandlerRegistry } from "@/handlers/services";
import { WebhookType } from "@/types/events";
import { logger } from "@/utils";
import { eventDispatcher } from "./event.dispatcher";

/**
 * @title Publish events Consumer
 * @description Specialized consumer for handling publish webhook events
 * @description Receives events from JetStream and routes them to appropriate targets
 */
export class PublishConsumer {
    private isRunning = false;

    public async start(): Promise<void> {
        if (this.isRunning) {
            logger.debug("Publish consumer already running");
            return;
        }

        try {
            logger.debug("🚀 Starting Publish Consumer...");

            // Initialize service handlers
            await serviceHandlerRegistry.initializeDefaultHandlers();

            this.isRunning = true;
            logger.debug("✅ Publish consumer started successfully");
        } catch (error) {
            console.error("❌ Failed to start publish consumer:", error);
            throw error;
        }
    }

    /**
     * Process a publish event from JetStream
     */
    public async processPublishEvent(messageData: any): Promise<void> {
        try {
            // TODO:Validate event structure
            if (!eventRouter.validateEvent(messageData)) {
                logger.debug("Invalid event structure, skipping");
                return;
            }

            // Check if this is a publish webhook type
            if (
                !eventRouter.shouldProcessEvent(
                    messageData.webhookType,
                    WebhookType.PUBLISH
                )
            ) {
                logger.debug(
                    `Skipping non-publish event: ${messageData.webhookType}`
                );
                return;
            }

            logger.debug(`📨 Processing publish event: ${messageData.eventId}`);

            // Route event to appropriate handler
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

            logger.debug(`✅ Publish event processed: ${messageData.eventId}`);
        } catch (error) {
            console.error("❌ Error processing publish event:", error);
            throw error;
        }
    }

    public async stop(): Promise<void> {
        if (!this.isRunning) {
            return;
        }

        try {
            this.isRunning = false;
            logger.debug("👋 Publish consumer stopped");
        } catch (error) {
            console.error("Error stopping publish consumer:", error);
            throw error;
        }
    }

    public getStatus(): boolean {
        return this.isRunning;
    }
}

export const publishConsumer = new PublishConsumer();
