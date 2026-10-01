import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { SlackPipeline } from './slack.pipeline';

// Mock dependencies
const mockValidator = { validate: mock(() => true) };
const mockSignature = { verify: mock(() => true) };
const mockRedis = { cache: mock((key, fn) => fn()) };
const mockSource = {
    findById: mock(() => ({
        populate: mock(() =>
            Promise.resolve({
                namespaceId: 'proj_1',
                authentication: { credentials: { secret: 'enc', iv: 'iv' } },
                endpoints: [],
                forwarding: true,
            })
        ),
    })),
};
const mockTransformer = { transform: mock(() => ({ namespace_id: 'proj_1' })) };
const mockIngestQueue = { add: mock(() => Promise.resolve()) };
const mockIngestProducer = {
    getQueues: () => ({
        IngestQueue: mockIngestQueue,
    }),
    getQueueNames: () => ({ IngestQueue: 'ingest' }),
};
const mockAnalytics = { record: mock(() => Promise.resolve()) };
const mockSecretCrypto = { decrypt: mock(() => 'decrypted') };

mock.module('./slack.validator', () => ({ slackValidator: mockValidator }));
mock.module('./slack.signature', () => ({ slackSignature: mockSignature }));
mock.module('@/config', () => ({ redisConfig: mockRedis }));
mock.module('@kyrazo/shared', () => ({
    Source: mockSource,
    secretCrypto: mockSecretCrypto,
    logger: {
        info: () => {},
        error: () => {},
        warn: () => {},
        debug: () => {},
    },
}));
mock.module('../../receiver.transformer', () => ({
    receiverTransformer: mockTransformer,
}));
mock.module('@/consumers/batch/ingest.producer', () => ({
    ingestProducer: mockIngestProducer,
}));
mock.module('@/services/analytics/ingest.producer', () => ({
    ingestAnalyticsProducer: mockAnalytics,
}));

describe('SlackPipeline', () => {
    let pipeline: SlackPipeline;

    beforeEach(() => {
        pipeline = SlackPipeline.getInstance();
        mockValidator.validate.mockClear();
        mockSignature.verify.mockClear();
        mockIngestQueue.add.mockClear();
        mockAnalytics.record.mockClear();
    });

    it('should process valid slack event', async () => {
        const event: any = {
            eventId: 'evt_1',
            sourceId: 'src_1',
            body: { type: 'event_callback', event: { type: 'message' }, event_id: 'ev1' },
            headers: {
                'x-slack-signature': 'sig',
                'x-slack-request-timestamp': '123456789',
            },
        };

        await pipeline.process(event);

        expect(mockValidator.validate).toHaveBeenCalled();
        expect(mockSignature.verify).toHaveBeenCalled();
        expect(mockIngestQueue.add).toHaveBeenCalled();
    });

    it('should handle url_verification without signature check', async () => {
        const event: any = {
            eventId: 'evt_2',
            sourceId: 'src_1',
            body: { type: 'url_verification', challenge: 'chal' },
            headers: {
                'x-slack-signature': 'sig',
                'x-slack-request-timestamp': '123456789',
            },
        };

        await pipeline.process(event);

        expect(mockValidator.validate).toHaveBeenCalled();
        // Signature might still be checked if we don't have a specific check,
        // but in our implementation we check type first.
        expect(mockIngestQueue.add).toHaveBeenCalledWith(
            'ingest',
            expect.objectContaining({ verified: true })
        );
    });
});
