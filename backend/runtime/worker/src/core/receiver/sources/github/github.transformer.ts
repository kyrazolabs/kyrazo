import type { IDispatchedEvent } from '@/core/dispatcher/dispatcher.types';
import type { IReceivedEvent } from '@/types/events/event.types';
import type { GitHubWebhookPayload } from './github.types';
import crypto from 'crypto';

export class GitHubTransformer {
    static instance: GitHubTransformer;

    private constructor() {}

    public static getInstance(): GitHubTransformer {
        if (!GitHubTransformer.instance) {
            GitHubTransformer.instance = new GitHubTransformer();
        }
        return GitHubTransformer.instance;
    }

    public transform(
        event: IReceivedEvent<GitHubWebhookPayload>,
        endpoints: any[]
    ): IDispatchedEvent {
        const githubEvent = event.headers['x-github-event'] as string;
        const action = event.body.action;
        const fullEventType = action ? `${githubEvent}.${action}` : githubEvent;
        const deliveryId = event.headers['x-github-delivery'] as string;

        return {
            id: event.eventId,
            type: fullEventType,
            timestamp: new Date().getTime(), // GitHub doesn't always provide a top-level timestamp like Stripe

            workspaceId: event.workspaceId,
            namespaceId: event.namespaceId,

            sourceId: event.sourceId,
            sourceType: event.sourceType,

            provider: {
                name: 'github',
                eventId: deliveryId,
                resourceId: event.body.repository?.id?.toString() || '0',
            },

            data: {
                object: event.body,
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

export const githubTransformer = GitHubTransformer.getInstance();
