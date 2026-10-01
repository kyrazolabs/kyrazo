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
    logger: {
        info: mock(() => {}),
        error: mock(() => {}),
        warn: mock(() => {}),
        debug: mock(() => {}),
    },
    databaseConfig: { disconnect: mock(() => Promise.resolve()) },
    secretCrypto: {
        encrypt: (salt: string, text: string) => ({ iv: "iv", encrypted: "enc" }),
        decrypt: (salt: string, iv: string, encrypted: string) => "dec",
    },
    unprefixId: (id: string) => id,
    ProcessingStatus: { PROCESSED: "processed" },
}));
mock.module("@/config", () => ({
    redisConfig: { disconnect: mock(() => Promise.resolve()) },
    natsConfig: { disconnect: mock(() => Promise.resolve()) },
}));

describe("WorkerLifecycle", () => {
    it("should initialize lifecycle", async () => {
        await lifecycle();
    });
});
