import { redisConfig } from '@/config';
import { type IDispatchedEvent } from './dispatcher.types';
import { targetRepository } from '@/services/mongo/target.repo';

export class DispatcherTransformer {
    static instance: DispatcherTransformer;

    private constructor() {}

    public static getInstance(): DispatcherTransformer {
        if (!DispatcherTransformer.instance) {
            DispatcherTransformer.instance = new DispatcherTransformer();
        }
        return DispatcherTransformer.instance;
    }

    public transform(event: any): IDispatchedEvent {
        return {
            id: event.eventId,
            type: event.eventType,
            timestamp: event.timestamp ?? Date.now(),

            workspaceId: event.workspaceId,
            namespaceId: event.namespaceId,

            sourceId: null,
            sourceType: null,

            data: {
                object: event.data ?? {},
                previous: event.previous ?? null,
            },

            targets: (event.targets ?? []).map((t: any) => ({
                targetId: t.targetId,
                targetUrl: t.targetUrl,
                method: t.method,
                customHeaders: t.customHeaders,
                attempts: t.attempts ?? 0,
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

export const dispatcherTransformer = DispatcherTransformer.getInstance();
