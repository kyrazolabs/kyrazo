import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { ShopifyPipeline } from './shopify.pipeline';

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

mock.module('./shopify.validator', () => ({ shopifyValidator: mockValidator }));
mock.module('./shopify.signature', () => ({ shopifySignature: mockSignature }));
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

describe('ShopifyPipeline', () => {
    let pipeline: ShopifyPipeline;

    beforeEach(() => {
        pipeline = ShopifyPipeline.getInstance();
        mockValidator.validate.mockClear();
        mockSignature.verify.mockClear();
        mockIngestQueue.add.mockClear();
        mockAnalytics.record.mockClear();
    });

    it('should process valid shopify event', async () => {
        const event: any = {
            eventId: 'evt_1',
            sourceId: 'src_1',
            body: { id: 123 },
            headers: {
                'x-shopify-topic': 'orders/create',
                'x-shopify-webhook-id': 'delivery_1',
                'x-shopify-shop-domain': 'test.myshopify.com',
                'x-shopify-hmac-sha256': 'sig',
            },
        };

        await pipeline.process(event);

        expect(mockValidator.validate).toHaveBeenCalled();
        expect(mockSignature.verify).toHaveBeenCalled();
        expect(mockIngestQueue.add).toHaveBeenCalled();
        expect(mockAnalytics.record).toHaveBeenCalled();
    });

    it('should fail if signature is invalid', async () => {
        mockSignature.verify.mockImplementationOnce(() => false);
        const event: any = {
            eventId: 'evt_2',
            sourceId: 'src_1',
            body: { id: 123 },
            headers: {
                'x-shopify-topic': 'orders/create',
                'x-shopify-webhook-id': 'delivery_2',
                'x-shopify-shop-domain': 'test.myshopify.com',
                'x-shopify-hmac-sha256': 'wrong_sig',
            },
        };

        await pipeline.process(event);

        expect(mockSignature.verify).toHaveBeenCalled();
        expect(mockIngestQueue.add).toHaveBeenCalledWith(
            'ingest',
            expect.objectContaining({ verified: false })
        );
    });
});
