import { describe, it, expect } from 'bun:test';
import { webflowTransformer } from './webflow.transformer';
import type { IReceivedEvent } from '@/types/events/event.types';
import type { WebflowWebhookPayload } from './webflow.types';
import { ProcessingStatus } from '@/types/events/event.types';

describe('WebflowTransformer', () => {
    it('should transform a Webflow event', () => {
        const event: IReceivedEvent<WebflowWebhookPayload> = {
            eventId: 'evt_123',
            workspaceId: 'ws_123',
            namespaceId: 'proj_123',
            userId: 'user_123',
            sourceId: 'src_123',
            sourceType: 'receive',
            source: 'webflow',
            ingressId: 'ing_123',
            receivedAt: new Date(),
            headers: {
                'x-webflow-signature': 'sig_123',
                'x-webflow-timestamp': '1738674688000',
            },
            body: {
                triggerType: 'form_submission',
                siteId: 'site_123',
                workspaceId: 'ws_123',
                timestamp: 1738674688000,
                payload: {
                    _id: 'form_123',
                    name: 'Contact Form',
                    data: { name: 'John Doe' },
                },
            },
            verified: true,
            processingStatus: ProcessingStatus.PENDING,
        };

        const endpoints = [{ _id: 'target_1', url: 'https://example.com/webhook', method: 'POST' }];

        const result = webflowTransformer.transform(event, endpoints);

        expect(result.type).toBe('form_submission');
        expect(result.provider!.name).toBe('webflow');
        expect(result.provider!.eventId).toBe('form_123');
        expect(result.provider!.resourceId).toBe('site_123');
        expect(result.targets).toHaveLength(1);
    });
});
