import { describe, it, expect, mock } from "bun:test";
import { lifecycle } from "./worker.lifecycle";

// Mock dependencies
const mockIngestProducer = { close: mock(() => Promise.resolve()) };
const mockDispatchProducer = { close: mock(() => Promise.resolve()) };
const mockDispatchConsumer = { shutdown: mock(() => Promise.resolve()) };

mock.module("@/consumers/batch/ingest.producer", () => ({
    ingestProducer: mockIngestProducer,
}));
mock.module("@/consumers/batch/dispatch.producer", () => ({
    dispatchProducer: mockDispatchProducer,
}));
mock.module("@/consumers/queues/dispatch.consumer", () => ({
    dispatchConsumer: mockDispatchConsumer,
}));
mock.module("@kyrazo/shared", () => ({
    logger: { info: () => {}, error: () => {} },
    databaseConfig: { disconnect: mock(() => Promise.resolve()) },
}));
mock.module("@/config", () => ({
    redisConfig: { disconnect: mock(() => Promise.resolve()) },
    natsConfig: { disconnect: mock(() => Promise.resolve()) },
    clickhouseConfig: { disconnect: mock(() => Promise.resolve()) },
}));

describe("WorkerLifecycle", () => {
    it("should initialize lifecycle", async () => {
        await lifecycle();
    });
});
