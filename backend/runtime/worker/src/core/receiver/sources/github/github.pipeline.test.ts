import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { GitHubPipeline } from './github.pipeline';

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

mock.module('./github.validator', () => ({ githubValidator: mockValidator }));
mock.module('./github.signature', () => ({ githubSignature: mockSignature }));
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

describe('GitHubPipeline', () => {
    let pipeline: GitHubPipeline;

    beforeEach(() => {
        pipeline = GitHubPipeline.getInstance();
        mockValidator.validate.mockClear();
        mockSignature.verify.mockClear();
        mockIngestQueue.add.mockClear();
        mockAnalytics.record.mockClear();
    });

    it('should process valid github event', async () => {
        const event: any = {
            eventId: 'evt_1',
            sourceId: 'src_1',
            body: { repository: { id: 123 } },
            headers: {
                'x-github-event': 'push',
                'x-github-delivery': 'delivery_1',
                'x-hub-signature-256': 'sha256=sig',
            },
        };

        await pipeline.process(event);

        expect(mockValidator.validate).toHaveBeenCalled();
        expect(mockSignature.verify).toHaveBeenCalled();
        expect(mockIngestQueue.add).toHaveBeenCalled();
        expect(mockAnalytics.record).toHaveBeenCalled();
    });
});
