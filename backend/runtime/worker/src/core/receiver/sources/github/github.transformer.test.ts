import { describe, it, expect } from 'bun:test';
import { githubTransformer } from './github.transformer';
import type { IReceivedEvent } from '@/types/events/event.types';
import type { GitHubWebhookPayload } from './github.types';
import { ProcessingStatus } from '@/types/events/event.types';

describe('GitHubTransformer', () => {
    it('should transform a GitHub push event', () => {
        const event: IReceivedEvent<GitHubWebhookPayload> = {
            eventId: 'evt_123',
            workspaceId: 'ws_123',
            namespaceId: 'proj_123',
            userId: 'user_123',
            sourceId: 'src_123',
            sourceType: 'github',
            source: 'github',
            ingressId: 'ing_123',
            receivedAt: new Date(),
            headers: {
                'x-github-event': 'push',
                'x-github-delivery': 'delivery_123',
            },
            body: {
                repository: {
                    id: 12345,
                    full_name: 'owner/repo',
                },
                sender: {
                    login: 'octocat',
                    id: 1,
                },
            },
            verified: true,
            processingStatus: ProcessingStatus.PENDING,
        };

        const endpoints = [{ _id: 'target_1', url: 'https://example.com/webhook', method: 'POST' }];

        const result = githubTransformer.transform(event, endpoints);

        expect(result.type).toBe('push');
        expect(result.provider!.name).toBe('github');
        expect(result.provider!.eventId).toBe('delivery_123');
        expect(result.provider!.resourceId).toBe('12345');
        expect(result.targets).toHaveLength(1);
        expect(result.targets[0].targetUrl).toBe('https://example.com/webhook');
    });

    it('should transform a GitHub pull_request opened event', () => {
        const event: IReceivedEvent<GitHubWebhookPayload> = {
            eventId: 'evt_456',
            workspaceId: 'ws_123',
            namespaceId: 'proj_123',
            userId: 'user_123',
            sourceId: 'src_123',
            sourceType: 'github',
            source: 'github',
            ingressId: 'ing_123',
            receivedAt: new Date(),
            headers: {
                'x-github-event': 'pull_request',
                'x-github-delivery': 'delivery_456',
            },
            body: {
                action: 'opened',
                repository: {
                    id: 67890,
                    full_name: 'owner/repo2',
                },
            },
            verified: true,
            processingStatus: ProcessingStatus.PENDING,
        };

        const result = githubTransformer.transform(event, []);

        expect(result.type).toBe('pull_request.opened');
        expect(result.provider!.resourceId).toBe('67890');
    });
});
