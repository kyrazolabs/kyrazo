import type { IDispatchedEvent } from '@/core/dispatcher/dispatcher.types';
import type { PayPalWebhookEvent } from './paypal.types';
import type { IReceivedEvent } from '@/types/events/event.types';

export class PayPalTransformer {
    static instance: PayPalTransformer;

    private constructor() {}

    public static getInstance(): PayPalTransformer {
        if (!PayPalTransformer.instance) {
            PayPalTransformer.instance = new PayPalTransformer();
        }
        return PayPalTransformer.instance;
    }

    public transform(
        event: IReceivedEvent<PayPalWebhookEvent>,
        endpoints: object[]
    ): IDispatchedEvent {
        return {
            id: event.eventId,
            type: event.body.event_type,
            timestamp: new Date(event.body.create_time).getTime(),

            workspaceId: event.workspaceId,
            namespaceId: event.namespaceId,

            sourceId: event.sourceId,
            sourceType: event.sourceType,

            provider: {
                name: 'paypal',
                eventId: event.body.id,
                resourceId: event.body.resource?.id as string,
            },

            data: {
                object: event.body ?? {},
                previous: null,
            },

            targets: (endpoints ?? []).map((t: any) => ({
                targetId: t._id,
                targetUrl: t.url,
                method: t.method,
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

export const paypalTransformer = PayPalTransformer.getInstance();
