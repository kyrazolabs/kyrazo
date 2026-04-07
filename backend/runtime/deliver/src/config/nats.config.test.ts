import { describe, it, expect, mock } from "bun:test";
import { NatsConfig } from "./nats.config";

// Mock NATS
mock.module("nats", () => ({
    connect: mock(() =>
        Promise.resolve({
            closed: () => Promise.resolve(),
            close: mock(() => Promise.resolve()),
        }),
    ),
}));

mock.module("@kyrazo/shared", () => ({
    logger: {
        info: () => {},
        error: () => {},
        warn: () => {},
        debug: () => {},
    },
}));

describe("NatsConfig", () => {
    let natsConfig: NatsConfig;

    it("should be a singleton", () => {
        const instance1 = NatsConfig.getInstance();
        const instance2 = NatsConfig.getInstance();
        expect(instance1).toBe(instance2);
    });

    it("should provide connection details", () => {
        natsConfig = NatsConfig.getInstance();
        expect(natsConfig.getConnectionStatus()).toBeDefined();
    });
});
