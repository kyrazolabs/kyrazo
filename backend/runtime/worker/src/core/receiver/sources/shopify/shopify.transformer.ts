import type { IDispatchedEvent } from '@/core/dispatcher/dispatcher.types';
import type { IReceivedEvent } from '@/types/events/event.types';
import type { ShopifyWebhookPayload } from './shopify.types';
import crypto from 'crypto';

export class ShopifyTransformer {
    static instance: ShopifyTransformer;

    private constructor() {}

    public static getInstance(): ShopifyTransformer {
        if (!ShopifyTransformer.instance) {
            ShopifyTransformer.instance = new ShopifyTransformer();
        }
        return ShopifyTransformer.instance;
    }

    public transform(
        event: IReceivedEvent<ShopifyWebhookPayload>,
        endpoints: any[]
    ): IDispatchedEvent {
        const topic = event.headers['x-shopify-topic'] as string;
        // Topics come like 'orders/create', we normalize to 'shopify.orders.create'
        const normalizedType = topic.replace(/\//g, '.');
        const webhookId = event.headers['x-shopify-webhook-id'] as string;
        const shopDomain = event.headers['x-shopify-shop-domain'] as string;

        return {
            id: event.eventId,
            type: normalizedType,
            timestamp: event.headers['x-shopify-triggered-at']
                ? new Date(event.headers['x-shopify-triggered-at']).getTime()
                : new Date().getTime(),

            workspaceId: event.workspaceId,
            namespaceId: event.namespaceId,

            sourceId: event.sourceId,
            sourceType: event.sourceType,

            provider: {
                name: 'shopify',
                eventId: webhookId,
                resourceId: event.body.id?.toString() || shopDomain,
            },

            data: {
                object: event.body,
                previous: null,
            },

            targets: (endpoints ?? []).map((t: any) => ({
                targetId: t._id || t.id,
                targetUrl: t.url,
                method: t.method || 'POST',
                customHeaders: t.customHeaders,
                attempts: 0,
                lastAttemptAt: null,
                nextRetryAt: null,
                responseCode: undefined,
                responseBody: undefined,
                responseTimeMs: undefined,
                errorMessage: undefined,
            })),

            meta: {
                priority: 'normal',
                maxRetries: 3,
                insertedAt: new Date(),
                nonce: crypto.randomUUID(),
                version: '1.0.0',
                source: event.source,
            },
        };
    }
}

export const shopifyTransformer = ShopifyTransformer.getInstance();
