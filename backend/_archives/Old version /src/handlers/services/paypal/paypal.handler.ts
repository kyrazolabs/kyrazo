import { IServiceHandler, ServiceType } from "@/types/services";
import {
    WebhookType,
    ProcessingStatus,
    IReceivedEvent,
} from "@/types/events/event.types";
import { paypalValidator } from "./paypal.validator";
import { paypalTransformer } from "./paypal.transformer";
import { receivedEventRepository } from "@/database/models/clickhouse/repositories/received.repo";
import { eventDispatcher } from "@/app/event/event.dispatcher";
import { Webhook } from "@/database/models/mongodb/Webhook";
import { encryptionUtils } from "@/utils";
import { logger } from "@/utils";

/**
 * @title PayPal Service Handler
 * @description Handles PayPal-specific webhook events with proper validation and processing
 */
export class PayPalHandler implements IServiceHandler {
    serviceType = ServiceType.PAYPAL;

    canHandle(eventType: string): boolean {
        // PayPal handler is selected by the registry based on source, not eventType
        // This method is kept for interface compatibility but not used for routing decisions
        return true;
    }

    async process(event: any, targets: any[]): Promise<void> {
        try {
            logger.debug(`PayPalHandler processing event: ${event.eventId}`);

            // 1. Get webhook to access secret for verification
            const webhook = await Webhook.findById(event.webhookId).populate(
                "endpoints"
            );
            if (!webhook) {
                logger.error(`Webhook not found: ${event.webhookId}`);
                await this.storeReceivedEvent(
                    event,
                    false,
                    "Webhook not found",
                    webhook
                );
                return;
            }

            // 2. Verify PayPal signature
            if (
                !webhook.authentication?.service?.secret ||
                !webhook.authentication?.service?.iv
            ) {
                logger.warn(
                    `PayPal webhook ${event.webhookId} is missing authentication credentials, skipping signature verification`
                );
                await this.storeReceivedEvent(
                    event,
                    false,
                    "Missing authentication credentials",
                    webhook
                );
                return;
            }

            let webhookSecret: string;
            try {
                webhookSecret = encryptionUtils.decryptSecret(
                    webhook.authentication.service.secret,
                    webhook.authentication.service.iv
                );
            } catch (error) {
                logger.error(
                    `Failed to decrypt PayPal webhook secret for ${event.webhookId}:`,
                    error
                );
                await this.storeReceivedEvent(
                    event,
                    false,
                    "Failed to decrypt authentication credentials",
                    webhook
                );
                return;
            }

            const isValid = await paypalValidator.verifySignature(
                JSON.stringify(event.body),
                event.headers || {},
                webhookSecret
            );

            if (!isValid) {
                logger.warn(
                    `Invalid PayPal signature for event: ${event.eventId}`
                );
                // Still store the event but mark as unverified
                await this.storeReceivedEvent(
                    event,
                    false,
                    "Signature verification failed",
                    webhook
                );
                return;
            }

            // 3. Validate PayPal event structure
            if (!paypalValidator.validateEventStructure(event)) {
                logger.error(
                    `Invalid PayPal event structure for ${event.eventId}`
                );
                await this.storeReceivedEvent(
                    event,
                    false,
                    "Invalid event structure",
                    webhook
                );
                return;
            }

            // 4. Check if this should be routed to endpoint
            if (
                webhook.forwarding &&
                webhook.endpoints &&
                webhook.endpoints.length > 0
            ) {
                logger.debug(
                    `PayPal event ${event.eventId} routing to endpoint`
                );

                // Transform for endpoint delivery with custom headers (not PayPal headers)
                const endpointPayload = paypalTransformer.transformForTarget(
                    event,
                    "endpoint"
                );
                const customHeaders = this.createCustomHeaders(event, "paypal");

                // Add to dispatch queue with custom headers
                await eventDispatcher.dispatchToTargets(
                    {
                        eventId: event.eventId,
                        workspaceId: event.workspaceId,
                        webhookId: event.webhookId,
                        webhookType: "publish",
                        producerId: "paypal-handler",
                        eventType: event.eventType,
                        timestamp: Date.now(),
                        data: endpointPayload,
                        meta: {
                            priority: event.routeToMeta?.priority || "normal",
                            maxRetries: event.routeToMeta?.maxRetries || 3,
                            insertedAt: new Date(),
                        },
                    },
                    event.webhookId,
                    webhook.endpoints.map((endpoint: any) => ({
                        targetId: endpoint._id,
                        targetUrl: endpoint.url,
                    })) // Use populated endpoint URLs
                );

                logger.info(
                    `✅ PayPal event routed to ${
                        webhook.endpoints.length
                    } endpoints: ${event.eventId} (${webhook.endpoints
                        .map((e: any) => e.targetUrl)
                        .join(", ")})`
                );
                await this.storeReceivedEvent(
                    event,
                    true,
                    `Routed to ${
                        webhook.endpoints.length
                    } endpoints: ${webhook.endpoints
                        .map((e: any) => e.targetUrl)
                        .join(", ")}`,
                    webhook
                );
                return;
            }

            // 5. Store the received event (if not routing to endpoint)
            await this.storeReceivedEvent(
                event,
                true,
                "Processed successfully",
                webhook
            );

            logger.info(`✅ PayPal event stored: ${event.eventId}`);
        } catch (error) {
            logger.error(
                `❌ Error processing PayPal event ${event.eventId}:`,
                error
            );
            throw error;
        }
    }

    /**
     * Store received event in database
     */
    private async storeReceivedEvent(
        event: any,
        isVerified: boolean,
        error?: string,
        webhook?: any
    ): Promise<void> {
        const transformedEvent = paypalTransformer.transformForStorage(event);

        const receivedEvent: IReceivedEvent = {
            eventId: transformedEvent.eventId,
            source: "paypal",
            workspaceId: event.workspaceId || "default",
            webhookId: event.webhookId,
            ingressId: event.ingressId || `paypal_${Date.now()}`,
            userId: event.userId,

            receivedAt: event.receivedAt
                ? new Date(event.receivedAt)
                : new Date(),
            headers: this.convertHeadersToMap(event.headers || {}),
            body: transformedEvent.data,
            processingStatus: isVerified
                ? ProcessingStatus.PROCESSED
                : ProcessingStatus.FAILED,
            verified: isVerified,
            processingError: error,

            routeTo: webhook?.endpoints
                ? webhook.endpoints.map((e: any) => e.url).join(", ")
                : event.routeTo,
            routeToMeta: event.routeToMeta,
        };

        await receivedEventRepository.saveReceivedEvent(receivedEvent);

        logger.debug(
            `💾 Stored PayPal event: ${event.eventId} (verified: ${isVerified})`
        );
    }

    /**
     * Create custom headers for endpoint delivery (without PayPal-specific headers)
     */
    private createCustomHeaders(
        event: any,
        source: string
    ): Record<string, string> {
        return {
            "Content-Type": "application/json",
            "User-Agent": "Hookify-Worker/1.0",
            "X-Event-ID": event.eventId,
            "X-Source": source,
            "X-Original-Event-Type": event.eventType,
            "X-Timestamp": Date.now().toString(),
        };
    }

    /**
     * Convert headers object to Map for storage
     */
    private convertHeadersToMap(
        headers: Record<string, string>
    ): Map<string, string> {
        const headerMap = new Map<string, string>();

        if (headers) {
            Object.entries(headers).forEach(([key, value]) => {
                headerMap.set(key.toLowerCase(), String(value));
            });
        }

        return headerMap;
    }
}

export const paypalHandler = new PayPalHandler();
