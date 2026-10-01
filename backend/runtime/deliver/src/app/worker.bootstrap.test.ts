import { describe, it, expect, mock } from "bun:test";
import { bootstrap } from "./worker.bootstrap";

// Mock dependencies
mock.module("@/config", () => ({
    redisConfig: { connect: mock(() => Promise.resolve()) },
    natsConfig: { connect: mock(() => Promise.resolve()) },
}));
mock.module("./worker.lifecycle", () => ({
    lifecycle: mock(() => {}),
}));
mock.module("@kyrazo/shared", () => ({
    logger: {
        info: mock(() => {}),
        error: mock(() => {}),
        warn: mock(() => {}),
        debug: mock(() => {}),
    },
    databaseConfig: { connect: mock(() => Promise.resolve()) },
    Source: { syncIndexes: mock(() => Promise.resolve()) },
    Endpoint: { syncIndexes: mock(() => Promise.resolve()) },
    secretCrypto: {
        encrypt: (salt: string, text: string) => ({ iv: "iv", encrypted: "enc" }),
        decrypt: (salt: string, iv: string, encrypted: string) => "dec",
    },
    unprefixId: (id: string) => id,
    ProcessingStatus: { PROCESSED: "processed" },
}));
mock.module("@/consumers/nats/nats.listener", () => ({
    WorkerConsumer: class {
        start = mock(() => Promise.resolve());
    },
}));
mock.module("@/consumers/batch/dispatch.producer", () => ({
    dispatchProducer: { initialize: mock(() => Promise.resolve()) },
}));
mock.module("@/consumers/batch/ingest.producer", () => ({
    ingestProducer: { initialize: mock(() => Promise.resolve()) },
}));
mock.module("@/consumers/queues/dispatch.consumer", () => ({
    dispatchConsumer: { initialize: mock(() => Promise.resolve()) },
}));

describe("WorkerBootstrap", () => {
    it("should bootstrap successfully", async () => {
        const result = await bootstrap();
        expect(result).toBe(true);
    });
});
