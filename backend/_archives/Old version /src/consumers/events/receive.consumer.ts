import { eventRouter } from "./event.router";
import { serviceHandlerRegistry } from "@/handlers/services";
import { WebhookType } from "@/types/events";
import { logger } from "@/utils";
import { Webhook } from "@/database/models/mongodb/Webhook";

/**
 * @title Receive Events Consumer
 * @description Specialized consumer for handling receive webhook events
 * @description Receives events from external services, validates signatures, and stores in database
 */
export class ReceiveConsumer {
    private isRunning = false;

    public async start(): Promise<void> {
        if (this.isRunning) {
            logger.debug("Receive consumer already running");
            return;
        }

        try {
            logger.debug("🚀 Starting Receive Consumer...");

            // Initialize service handlers
            await serviceHandlerRegistry.initializeDefaultHandlers();

            this.isRunning = true;
            logger.debug("✅ Receive consumer started successfully");
        } catch (error) {
            console.error("❌ Failed to start receive consumer:", error);
            throw error;
        }
    }

    /**
     * Process a receive event from JetStream
     */
    public async processReceiveEvent(messageData: any): Promise<void> {
        try {
            // Validate event structure
            if (!eventRouter.validateEvent(messageData)) {
                logger.debug("Invalid receive event structure, skipping");
                return;
            }

            // Check if this is a receive webhook type
            if (
                !eventRouter.shouldProcessEvent(
                    messageData.webhookType,
                    WebhookType.RECEIVE
                )
            ) {
                logger.debug(
                    `Skipping non-receive event: ${messageData.webhookType}`
                );
                return;
            }

            logger.info(
                `📨 Processing receive event: ${messageData.eventId} from source: ${messageData.source}`
            );

            // 1. Validate webhook exists and is active
            const webhook = await this.validateWebhook(messageData.webhookId);

            // 2. Route to appropriate service handler based on source
            // The handler will handle signature verification and event storage
            await this.routeToServiceHandler(messageData, webhook);

            logger.debug(`✅ Receive event processed: ${messageData.eventId}`);
        } catch (error) {
            console.error("❌ Error processing receive event:", error);
            throw error;
        }
    }

    /**
     * Validate webhook exists and is active
     */
    private async validateWebhook(webhookId: string): Promise<any> {
        const webhook = await Webhook.findById(webhookId);
        if (!webhook) {
            throw new Error(`Webhook not found: ${webhookId}`);
        }
        if (webhook.status !== "active") {
            throw new Error(`Webhook is not active: ${webhookId}`);
        }
        return webhook;
    }

    /**
     * Route to appropriate service handler based on source
     */
    private async routeToServiceHandler(
        messageData: any,
        webhook: any
    ): Promise<void> {
        try {
            const source = messageData.source || "external";

            // Find appropriate handler based on source
            const handler = serviceHandlerRegistry.findHandler(messageData);

            if (handler) {
                logger.info(
                    `Routing ${messageData.eventId} to ${handler.serviceType} handler`
                );
                await handler.process(messageData, []);
            } else {
                logger.warn(
                    `No handler found for source: ${source}, using general handler`
                );
                // Use general handler as fallback
                const generalHandler = serviceHandlerRegistry.getHandler(
                    "general" as any
                );
                if (generalHandler) {
                    await generalHandler.process(messageData, []);
                }
            }
        } catch (error) {
            logger.error(
                `Error routing to service handler for event ${messageData.eventId}:`,
                error
            );
            throw error;
        }
    }

    /**
     * Graceful shutdown
     */
    public async stop(): Promise<void> {
        if (!this.isRunning) {
            return;
        }

        try {
            this.isRunning = false;
            logger.debug("👋 Receive consumer stopped");
        } catch (error) {
            console.error("Error stopping receive consumer:", error);
            throw error;
        }
    }

    /**
     * Get consumer status
     */
    public getStatus(): boolean {
        return this.isRunning;
    }
}

export const receiveConsumer = new ReceiveConsumer();
