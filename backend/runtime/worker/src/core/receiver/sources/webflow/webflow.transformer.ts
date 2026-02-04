import type { IDispatchedEvent } from '@/core/dispatcher/dispatcher.types';
import type { IReceivedEvent } from '@/types/events/event.types';
import type { WebflowWebhookPayload } from './webflow.types';
import crypto from 'crypto';

export class WebflowTransformer {
    static instance: WebflowTransformer;

    private constructor() {}

    public static getInstance(): WebflowTransformer {
        if (!WebflowTransformer.instance) {
            WebflowTransformer.instance = new WebflowTransformer();
        }
        return WebflowTransformer.instance;
    }

    public transform(
        event: IReceivedEvent<WebflowWebhookPayload>,
        endpoints: any[]
    ): IDispatchedEvent {
        const payload = event.body;
        const triggerType = payload.triggerType;
        const normalizedType = triggerType;

        const timestamp = payload.timestamp || new Date().getTime();
        const providerEventId = payload.payload?._id || `webflow_${crypto.randomUUID()}`;
        const resourceId = payload.siteId || payload.workspaceId || 'webflow';

        return {
            id: event.eventId,
            type: normalizedType,
            timestamp: timestamp,

            workspaceId: event.workspaceId,
            projectId: event.projectId,

            sourceId: event.sourceId,
            sourceType: event.sourceType,

            provider: {
                name: 'webflow',
                eventId: providerEventId,
                resourceId: resourceId,
            },

            data: {
                object: payload,
                previous: null,
            },

            targets: (endpoints ?? []).map((t: any) => ({
                targetId: t._id,
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

export const webflowTransformer = WebflowTransformer.getInstance();
