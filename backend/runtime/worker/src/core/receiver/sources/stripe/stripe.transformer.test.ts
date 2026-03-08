import { describe, it, expect, beforeEach } from 'bun:test';
import { StripeTransformer } from './stripe.transformer';

describe('StripeTransformer', () => {
    let transformer: StripeTransformer;

    beforeEach(() => {
        transformer = StripeTransformer.getInstance();
    });

    it('should transform Stripe event to IDispatchedEvent', () => {
        const event: any = {
            eventId: 'evt_1',
            workspaceId: 'ws_1',
            namespaceId: 'proj_1',
            sourceId: 'src_1',
            sourceType: 'stripe',
            source: 'stripe',
            body: {
                id: 'st_1',
                type: 'payment_intent.succeeded',
                created: 1234567890,
                data: {
                    object: { id: 'pi_1' },
                    previous_attributes: { status: 'processing' },
                },
            },
        };
        const endpoints = [{ _id: 'end_1', url: 'http://end.com' }];

        const result = transformer.transform(event, endpoints);

        expect(result.id).toBe(event.eventId);
        expect(result.type).toBe('payment_intent.succeeded');
        expect(result.timestamp).toBe(1234567890000);
        expect(result.targets[0].targetId).toBe('end_1');
        expect(result.provider?.name).toBe('stripe');
        expect(result.data.previous).toEqual({ status: 'processing' });
    });
});
