import { describe, it, expect } from 'bun:test';
import { slackTransformer } from './slack.transformer';
import type { IReceivedEvent } from '@/types/events/event.types';
import type { SlackEventPayload } from './slack.types';
import { ProcessingStatus } from '@/types/events/event.types';

describe('SlackTransformer', () => {
    it('should transform a Slack event', () => {
        const event: IReceivedEvent<SlackEventPayload> = {
            eventId: 'evt_123',
            workspaceId: 'ws_123',
            projectId: 'proj_123',
            userId: 'user_123',
            sourceId: 'src_123',
            sourceType: 'receive',
            source: 'slack',
            ingressId: 'ing_123',
            receivedAt: new Date(),
            headers: {
                'x-slack-signature': 'sig_123',
                'x-slack-request-timestamp': '123456789',
            },
            body: {
                type: 'event_callback',
                team_id: 'T123',
                event_id: 'Ev123',
                event_time: 123456789,
                event: {
                    type: 'message',
                    text: 'hello world',
                    user: 'U123',
                    event_ts: '123456789.0001',
                },
            },
            verified: true,
            processingStatus: ProcessingStatus.PENDING,
        };

        const endpoints = [{ _id: 'target_1', url: 'https://example.com/webhook', method: 'POST' }];

        const result = slackTransformer.transform(event, endpoints);

        expect(result.type).toBe('message');
        expect(result.provider!.name).toBe('slack');
        expect(result.provider!.eventId).toBe('Ev123');
        expect(result.provider!.resourceId).toBe('T123');
        expect(result.targets).toHaveLength(1);
    });

    it('should handle url_verification transformation', () => {
        const event: IReceivedEvent<SlackEventPayload> = {
            eventId: 'evt_456',
            workspaceId: 'ws_123',
            projectId: 'proj_123',
            userId: 'user_123',
            sourceId: 'src_123',
            sourceType: 'receive',
            source: 'slack',
            ingressId: 'ing_123',
            receivedAt: new Date(),
            headers: {},
            body: {
                type: 'url_verification',
                challenge: 'chal_123',
                event_id: 'Ev456',
                event_time: 123456789,
            },
            verified: true,
            processingStatus: ProcessingStatus.PENDING,
        };

        const result = slackTransformer.transform(event, []);

        expect(result.type).toBe('url_verification');
    });
});
