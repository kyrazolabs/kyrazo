import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { PayPalPipeline } from './paypal.pipeline';

// Mock dependencies
const mockValidator = { validate: mock(() => true) };
const mockSignature = { verify: mock(() => Promise.resolve(true)) };
const mockRedis = { cache: mock((key, fn) => fn()) };
const mockSource = {
    findById: mock(() => ({
        populate: mock(() =>
            Promise.resolve({
                namespaceId: 'proj_1',
                authentication: { credentials: { secret: 'enc', iv: 'iv' } },
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

mock.module('./paypal.validator', () => ({ paypalValidator: mockValidator }));
mock.module('./paypal.signature', () => ({ paypalSignature: mockSignature }));
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

describe('PayPalPipeline', () => {
    let pipeline: PayPalPipeline;

    beforeEach(() => {
        pipeline = PayPalPipeline.getInstance();
        mockValidator.validate.mockClear();
        mockSignature.verify.mockClear();
        mockIngestQueue.add.mockClear();
        mockAnalytics.record.mockClear();
    });

    it('should process valid paypal event', async () => {
        const event: any = {
            eventId: 'evt_1',
            sourceId: 'src_1',
            body: {},
            headers: {},
        };

        await pipeline.process(event);

        expect(mockValidator.validate).toHaveBeenCalledWith(event);
        expect(mockSignature.verify).toHaveBeenCalled();
        expect(mockIngestQueue.add).toHaveBeenCalled();
        expect(mockAnalytics.record).toHaveBeenCalled();
    });

    it('should handle invalid signature', async () => {
        mockSignature.verify.mockReturnValueOnce(Promise.resolve(false));
        const event: any = {
            eventId: 'evt_bad_sig',
            sourceId: 'src_1',
            body: {},
            headers: {},
        };

        await pipeline.process(event);

        expect(mockIngestQueue.add).toHaveBeenCalledWith(
            'ingest',
            expect.objectContaining({ verified: false })
        );
    });
});
