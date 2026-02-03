import { describe, it, expect, mock, beforeEach } from "bun:test";
import { DispatchProducer } from "./dispatch.producer";

// Mock BullMQ
const mockQueue = {
    on: mock(() => {}),
    add: mock(() => Promise.resolve()),
    close: mock(() => Promise.resolve()),
};

mock.module("bullmq", () => ({
    Queue: mock(() => mockQueue),
    Worker: mock(() => ({
        on: mock(() => {}),
        close: mock(() => Promise.resolve()),
    })),
}));

mock.module("@/config", () => ({
    redisConfig: { getQueueClient: () => ({}) },
    config: { worker: { concurrency: 10 } },
}));

mock.module("@kyrazo/shared", () => ({
    logger: {
        info: () => {},
        error: () => {},
        warn: () => {},
        debug: () => {},
    },
}));

describe("DispatchProducer", () => {
    let producer: DispatchProducer;

    beforeEach(() => {
        producer = DispatchProducer.getInstance();
    });

    it("should be a singleton", () => {
        const instance1 = DispatchProducer.getInstance();
        const instance2 = DispatchProducer.getInstance();
        expect(instance1).toBe(instance2);
    });

    it("should initialize queues", async () => {
        await producer.initialize();
        expect(producer.getQueues()).toBeDefined();
    });
});
