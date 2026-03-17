import type { IDispatchedEvent } from '@/core/dispatcher/dispatcher.types';
import type { StripeWebhookEvent } from './stripe.types';
import type { IReceivedEvent } from '@/types/events/event.types';
import crypto from 'crypto';

export class StripeTransformer {
    static instance: StripeTransformer;

    private constructor() {}

    public static getInstance(): StripeTransformer {
        if (!StripeTransformer.instance) {
            StripeTransformer.instance = new StripeTransformer();
        }
        return StripeTransformer.instance;
    }

    public transform(
        event: IReceivedEvent<StripeWebhookEvent>,
        endpoints: any[]
    ): IDispatchedEvent {
        return {
            id: event.eventId,
            type: event.body.type,
            timestamp: event.body.created * 1000,

            workspaceId: event.workspaceId,
            namespaceId: event.namespaceId,

            sourceId: event.sourceId,
            sourceType: event.sourceType,

            provider: {
                name: 'stripe',
                eventId: event.body.id,
                resourceId: event.body.data.object.id as string,
            },

            data: {
                object: event.body ?? {},
                previous: event.body.data.previous_attributes ?? null,
            },

            targets: (endpoints ?? []).map((t: any) => ({
                targetId: t.id || t.id,
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

export const stripeTransformer = StripeTransformer.getInstance();
