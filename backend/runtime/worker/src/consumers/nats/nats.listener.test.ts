import { describe, it, expect, mock, beforeEach } from "bun:test";
import { WorkerConsumer } from "./nats.listener";

// Mock NATS
mock.module("nats", () => ({
    connect: mock(() =>
        Promise.resolve({
            closed: () => Promise.resolve(),
            close: mock(() => Promise.resolve()),
            jetstream: mock(() => ({
                consumers: {
                    get: mock(() =>
                        Promise.resolve({
                            consume: mock(() => ({})),
                        }),
                    ),
                },
            })),
        }),
    ),
    StringCodec: mock(() => ({
        decode: mock(() => "{}"),
    })),
}));

mock.module("@/config", () => ({
    natsConfig: {
        getConnection: mock(() => ({
            jetstream: mock(() => ({})),
        })),
        getJetStreamManager: mock(() => ({
            consumers: { add: mock(() => Promise.resolve()) },
        })),
    },
}));

mock.module("@kyrazo/shared", () => ({
    logger: { info: () => {}, error: () => {} },
}));

mock.module("@/app/worker.env", () => ({
    env: { worker: { CONCURRENCY: 10 } },
}));

describe("WorkerConsumer", () => {
    let listener: WorkerConsumer;

    beforeEach(() => {
        listener = new WorkerConsumer("ws_1");
    });

    it("should start", async () => {
        expect(listener.start).toBeDefined();
    });
});
