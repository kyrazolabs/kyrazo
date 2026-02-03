import { describe, it, expect, mock, beforeEach } from "bun:test";
import { DispatchConsumer } from "./dispatch.consumer";

// Mock BullMQ
mock.module("bullmq", () => ({
    Worker: mock(() => ({ on: mock(() => {}) })),
    Queue: mock(() => ({ on: mock(() => {}) })),
    QueueEvents: mock(() => ({ on: mock(() => {}) })),
}));

mock.module("@/config", () => ({
    redisConfig: { getQueueClient: () => ({}) },
    appConfig: { worker: { concurrency: 10 } },
}));

mock.module("@kyrazo/shared", () => ({
    logger: {
        info: () => {},
        error: () => {},
        warn: () => {},
        debug: () => {},
    },
    secretCrypto: { decrypt: mock(() => "secret") },
}));

mock.module("@/services/http/http.requester", () => ({
    httpRequester: {
        request: mock(() => Promise.resolve({ ok: true, status: 200 })),
    },
}));

mock.module("@/services/analytics/dispatch.producer", () => ({
    dispatchAnalyticsProducer: { record: mock(() => Promise.resolve()) },
}));

mock.module("@/core/dispatcher/dispatcher.signature", () => ({
    dispatcherSignature: { sign: mock(() => Promise.resolve({})) },
}));

describe("DispatchConsumer", () => {
    let consumer: DispatchConsumer;

    beforeEach(() => {
        consumer = DispatchConsumer.getInstance();
    });

    it("should be a singleton", () => {
        const instance1 = DispatchConsumer.getInstance();
        const instance2 = DispatchConsumer.getInstance();
        expect(instance1).toBe(instance2);
    });

    it("should start onStart", async () => {
        await consumer.initialize();
    });
});
