import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { DispatchProducer } from './dispatch.producer';

// Mock BullMQ
mock.module('bullmq', () => ({
    Worker: mock(() => ({ on: mock(() => {}) })),
    Queue: mock(() => ({ on: mock(() => {}) })),
    QueueEvents: mock(() => ({ on: mock(() => {}) })),
}));

mock.module('@/config', () => ({
    redisConfig: { getQueueClient: () => ({}) },
    appConfig: { worker: { concurrency: 10 } },
}));

mock.module('@kyrazo/shared', () => ({
    logger: {
        info: () => {},
        error: () => {},
        warn: () => {},
        debug: () => {},
    },
    secretCrypto: { decrypt: mock(() => 'secret') },
}));

mock.module('@/services/http/http.requester', () => ({
    httpRequester: {
        request: mock(() => Promise.resolve({ ok: true, status: 200 })),
    },
}));

mock.module('@/services/analytics/dispatch.producer', () => ({
    dispatchAnalyticsProducer: { record: mock(() => Promise.resolve()) },
}));


describe('DispatchProducer', () => {
    let consumer: DispatchProducer;

    beforeEach(() => {
        consumer = DispatchProducer.getInstance();
    });

    it('should be a singleton', () => {
        const instance1 = DispatchProducer.getInstance();
        const instance2 = DispatchProducer.getInstance();
        expect(instance1).toBe(instance2);
    });

    it('should start onStart', async () => {
        await consumer.initialize();
    });
});
