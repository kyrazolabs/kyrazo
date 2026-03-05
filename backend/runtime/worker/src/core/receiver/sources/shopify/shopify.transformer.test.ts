import { describe, it, expect } from 'bun:test';
import { shopifyTransformer } from './shopify.transformer';
import type { IReceivedEvent } from '@/types/events/event.types';
import type { ShopifyWebhookPayload } from './shopify.types';
import { ProcessingStatus } from '@/types/events/event.types';

describe('ShopifyTransformer', () => {
    it('should transform a Shopify orders/create event', () => {
        const event: IReceivedEvent<ShopifyWebhookPayload> = {
            eventId: 'evt_123',
            workspaceId: 'ws_123',
            namespaceId: 'proj_123',
            userId: 'user_123',
            sourceId: 'src_123',
            sourceType: 'receive',
            source: 'shopify',
            ingressId: 'ing_123',
            receivedAt: new Date(),
            headers: {
                'x-shopify-topic': 'orders/create',
                'x-shopify-hmac-sha256': 'sig_123',
                'x-shopify-shop-domain': 'test.myshopify.com',
                'x-shopify-webhook-id': 'delivery_123',
                'x-shopify-triggered-at': '2023-01-01T00:00:00Z',
            },
            body: {
                id: 123456789,
                total_price: '100.00',
                currency: 'USD',
            },
            verified: true,
            processingStatus: ProcessingStatus.PENDING,
        };

        const endpoints = [{ _id: 'target_1', url: 'https://example.com/webhook', method: 'POST' }];

        const result = shopifyTransformer.transform(event, endpoints);

        expect(result.type).toBe('orders.create');
        expect(result.provider!.name).toBe('shopify');
        expect(result.provider!.eventId).toBe('delivery_123');
        expect(result.provider!.resourceId).toBe('123456789');
        expect(result.targets).toHaveLength(1);
        expect(result.targets[0].targetUrl).toBe('https://example.com/webhook');
    });

    it('should fallback to shop domain if id is missing', () => {
        const event: IReceivedEvent<ShopifyWebhookPayload> = {
            eventId: 'evt_456',
            workspaceId: 'ws_123',
            namespaceId: 'proj_123',
            userId: 'user_123',
            sourceId: 'src_123',
            sourceType: 'receive',
            source: 'shopify',
            ingressId: 'ing_123',
            receivedAt: new Date(),
            headers: {
                'x-shopify-topic': 'app/uninstalled',
                'x-shopify-hmac-sha256': 'sig_456',
                'x-shopify-shop-domain': 'test.myshopify.com',
                'x-shopify-webhook-id': 'delivery_456',
            },
            body: {},
            verified: true,
            processingStatus: ProcessingStatus.PENDING,
        };

        const result = shopifyTransformer.transform(event, []);

        expect(result.type).toBe('app.uninstalled');
        expect(result.provider!.resourceId).toBe('test.myshopify.com');
    });
});
