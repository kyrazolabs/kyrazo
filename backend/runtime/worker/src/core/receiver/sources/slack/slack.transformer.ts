import type { IDispatchedEvent } from '@/core/dispatcher/dispatcher.types';
import type { IReceivedEvent } from '@/types/events/event.types';
import type { SlackEventPayload } from './slack.types';
import crypto from 'crypto';

export class SlackTransformer {
    static instance: SlackTransformer;

    private constructor() {}

    public static getInstance(): SlackTransformer {
        if (!SlackTransformer.instance) {
            SlackTransformer.instance = new SlackTransformer();
        }
        return SlackTransformer.instance;
    }

    public transform(event: IReceivedEvent<SlackEventPayload>, endpoints: any[]): IDispatchedEvent {
        const payload = event.body;
        const eventType = payload.event?.type || payload.type;
        const normalizedType = eventType;

        const timestamp = payload.event_time ? payload.event_time * 1000 : new Date().getTime();
        const providerEventId = payload.event_id || `slack_${crypto.randomUUID()}`;
        const resourceId = payload.team_id || payload.api_app_id || 'slack';

        return {
            id: event.eventId,
            type: normalizedType,
            timestamp: timestamp,

            workspaceId: event.workspaceId,
            namespaceId: event.namespaceId,

            sourceId: event.sourceId,
            sourceType: event.sourceType,

            provider: {
                name: 'slack',
                eventId: providerEventId,
                resourceId: resourceId,
            },

            data: {
                object: payload,
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
        };
    }
}

export const slackTransformer = SlackTransformer.getInstance();
