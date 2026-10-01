import { IServiceHandler, ServiceType } from "@/types/services";
import {
    WebhookType,
    ProcessingStatus,
    IReceivedEvent,
} from "@/types/events/event.types";
import { externalValidator } from "./external.validator";
import { generalTransformer } from "./external.transformer";
import { receivedEventRepository } from "@/database/models/clickhouse/repositories/received.repo";
import { eventDispatcher } from "@/app/event/event.dispatcher";
import { Webhook } from "@/database/models/mongodb/Webhook";
import { logger } from "@/utils";

/**
 * @title External Service Handler
 * @description Handles webhook events from unsupported third-party services (Stripe, GitHub, Shopify, etc.)
 * @description Only processes receive events, validates authentication based on Webhook AuthenticationSchema
 * @description Supports HMAC, API Key, and Basic Auth (but not service authentication)
 */
export class ExternalHandler implements IServiceHandler {
    serviceType = ServiceType.GENERAL;

    canHandle(eventType: string): boolean {
        // External handler only handles receive events from unsupported services
        // The registry will determine when to use this handler based on source
        return true;
    }

    async process(event: any, targets: any[]): Promise<void> {
        try {
            logger.debug(
                `ExternalHandler processing event: ${
                    event.eventId
                } from source: ${event.source || "unknown"} (${
                    event.webhookType
                })`
            );

            // Only handle receive events from unsupported services
            if (event.webhookType !== "receive") {
                logger.debug(
                    `ExternalHandler only processes receive events, got: ${event.webhookType}`
                );
                return;
            }

            // 1. Basic event structure validation
            if (!externalValidator.validateEventStructure(event)) {
                throw new Error("Invalid event structure for external handler");
            }

            // 2. Get webhook for authentication validation
            const webhook = await Webhook.findById(event.webhookId);
            if (!webhook) {
                throw new Error(`Webhook not found: ${event.webhookId}`);
            }

            // 3. Validate webhook authentication if enabled
            if (webhook.authentication?.enabled) {
                await this.validateWebhookAuthentication(event, webhook);
            }

            // 4. Process the receive event
            await this.processReceiveEvent(event, targets);
        } catch (error) {
            logger.error(
                `❌ Error processing external event ${event.eventId}:`,
                error
            );
            throw error;
        }
    }

    /**
     * @title Process receive events
     */
    private async processReceiveEvent(
        event: any,
        targets: any[]
    ): Promise<void> {
        logger.debug(`Processing RECEIVE event: ${event.eventId}`);

        // Get webhook for basic validation (if webhookId provided)
        if (event.webhookId) {
            const webhook = await Webhook.findById(event.webhookId);
            if (!externalValidator.validateWebhook?.(webhook)) {
                throw new Error(`Invalid webhook: ${event.webhookId}`);
            }
        }

        // Check if this should be routed to endpoint immediately
        if (event.routeTo === "endpoint" && event.targetUrl) {
            logger.debug(
                `General RECEIVE event ${event.eventId} routing directly to endpoint`
            );

            // Transform for endpoint delivery
            const endpointPayload = generalTransformer.transformForTarget(
                event,
                "endpoint"
            );
            const customHeaders = this.createCustomHeaders(event, "general");

            // Add to dispatch queue with custom headers
            await eventDispatcher.dispatchToTargets(
                {
                    eventId: event.eventId,
                    workspaceId: event.workspaceId || "default",
                    webhookId: event.webhookId || "",
                    webhookType: "publish",
                    producerId: "general-handler",
                    eventType: event.eventType || "general.default",
                    timestamp: Date.now(),
                    data: endpointPayload,
                    meta: {
                        priority: event.routeToMeta?.priority || "normal",
                        maxRetries: event.routeToMeta?.maxRetries || 3,
                        insertedAt: new Date(),
                    },
                },
                event.webhookId || "",
                [{ targetUrl: event.targetUrl }]
            );

            logger.info(
                `✅ General RECEIVE event routed to endpoint: ${event.eventId}`
            );
            return;
        }

        // Store the received event (mark as processed since no verification needed)
        await this.storeReceivedEvent(event, true);

        logger.info(`✅ General RECEIVE event processed: ${event.eventId}`);
    }

    /**
     * @title Validate webhook authentication based on AuthenticationSchema
     */
    private async validateWebhookAuthentication(
        event: any,
        webhook: any
    ): Promise<void> {
        const auth = webhook.authentication;

        // Check which authentication method is configured (only one should be enabled)
        const authMethods = [];

        // Skip HMAC for now as requested
        // Skip HMAC for now as requested
        // Skip HMAC for now as requested
        // Skip HMAC for now as requested
        // Skip HMAC for now as requested
        // if (auth.enabled && auth.hmac.algorithm && auth.hmac.signingSecret) {
        //   authMethods.push('hmac');
        // }

        if (auth.enabled && auth.apiKey.apiKey) {
            authMethods.push("apiKey");
        }

        if (
            auth.enabled &&
            auth.basicAuth.username &&
            auth.basicAuth.password
        ) {
            authMethods.push("basicAuth");
        }

        // Service authentication is only for supported services (PayPal, etc.)
        // External handler should not use service authentication
        if (auth.service?.enabled) {
            throw new Error(
                "External handler does not support service authentication"
            );
        }

        if (authMethods.length === 0) {
            logger.debug(
                `No authentication configured for webhook ${webhook._id}`
            );
            return;
        }

        if (authMethods.length > 1) {
            throw new Error(
                "Multiple authentication methods configured - only one allowed"
            );
        }

        const method = authMethods[0];
        logger.debug(
            `Validating ${method} authentication for webhook ${webhook._id}`
        );

        // Validate based on authentication method
        switch (method) {
            // HMAC validation disabled for now
            // HMAC validation disabled for now
            // HMAC validation disabled for now
            // HMAC validation disabled for now
            // HMAC validation disabled for now
            // HMAC validation disabled for now
            // case 'hmac':
            //   await this.validateHMACAuthentication(event, webhook);
            //   break;
            case "apiKey":
                await this.validateApiKeyAuthentication(event, webhook);
                break;
            case "basicAuth":
                await this.validateBasicAuthAuthentication(event, webhook);
                break;
            default:
                throw new Error(`Unsupported authentication method: ${method}`);
        }
    }

    /**
     * @title Validate HMAC authentication
     */
    private async validateHMACAuthentication(
        event: any,
        webhook: any
    ): Promise<void> {
        const auth = webhook.authentication.hmac;

        if (!externalValidator.validateHMACSignature?.(event, auth)) {
            throw new Error("HMAC signature validation failed");
        }

        logger.debug(
            `✅ HMAC authentication validated for webhook ${webhook._id}`
        );
    }

    /**
     * @title Validate API Key authentication
     */
    private async validateApiKeyAuthentication(
        event: any,
        webhook: any
    ): Promise<void> {
        const auth = webhook.authentication.apiKey;

        if (!externalValidator.validateApiKey?.(event, auth)) {
            throw new Error("API key validation failed");
        }

        logger.debug(
            `✅ API key authentication validated for webhook ${webhook._id}`
        );
    }

    /**
     * @title Validate Basic Auth authentication
     */
    private async validateBasicAuthAuthentication(
        event: any,
        webhook: any
    ): Promise<void> {
        const auth = webhook.authentication.basicAuth;

        if (!externalValidator.validateBasicAuth?.(event, auth)) {
            throw new Error("Basic authentication validation failed");
        }

        logger.debug(`✅ Basic auth validated for webhook ${webhook._id}`);
    }

    /**
     * @title Store received event in database
     * @description Store general event with processed status (no verification needed)
     */
    private async storeReceivedEvent(
        event: any,
        isVerified: boolean = true,
        error?: string
    ): Promise<void> {
        try {
            const transformedEvent =
                generalTransformer.transformForDatabase(event);

            const receivedEvent: IReceivedEvent = {
                eventId: transformedEvent.event_id,
                source: transformedEvent.source,
                workspaceId: transformedEvent.workspace_id,
                webhookId: transformedEvent.webhook_id,
                ingressId: transformedEvent.ingress_id,
                userId: transformedEvent.user_id,

                receivedAt: transformedEvent.received_at,
                headers: this.convertHeadersToMap(transformedEvent.headers),
                body: transformedEvent.body,
                processingStatus: isVerified
                    ? ProcessingStatus.PROCESSED
                    : ProcessingStatus.FAILED,
                verified: isVerified,
                processingError: error || undefined,

                routeTo: transformedEvent.route_to,
                routeToMeta: transformedEvent.route_to_meta,
            };

            await receivedEventRepository.saveReceivedEvent(receivedEvent);

            logger.debug(
                `💾 Stored general event: ${event.eventId} (verified: ${isVerified})`
            );
        } catch (storageError) {
            logger.error(
                `❌ Error storing general event ${event.eventId}:`,
                storageError
            );
            throw storageError;
        }
    }

    /**
     * @title Create custom headers for endpoint delivery
     * @description Create standard headers for general event delivery
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
            "X-Original-Event-Type": event.eventType || "general.default",
            "X-Timestamp": Date.now().toString(),
            "X-General-Event": "true",
        };
    }

    /**
     * @title Convert headers object to Map for storage
     * @description Convert headers for database storage
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

    /**
     * @title Process event with minimal validation
     * @description Alternative processing method for very basic events
     */
    async processMinimal(event: any): Promise<void> {
        try {
            logger.debug(
                `GeneralHandler minimal processing for event: ${event.eventId}`
            );

            // Only require eventId and some data
            if (!event.eventId) {
                throw new Error("Event ID is required for minimal processing");
            }

            // Store with minimal validation
            await this.storeReceivedEvent(
                {
                    ...event,
                    source: event.source || "general",
                    eventType: event.eventType || "general.minimal",
                    body: event.body || event.data || {},
                },
                true
            );

            logger.info(
                `✅ General event minimally processed: ${event.eventId}`
            );
        } catch (error) {
            logger.error(
                `❌ Error in minimal processing for event ${event.eventId}:`,
                error
            );
            throw error;
        }
    }
}

export const externalHandler = new ExternalHandler();
