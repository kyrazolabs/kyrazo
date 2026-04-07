import { describe, it, expect, mock } from "bun:test";
import { RedisConfig } from "./redis.config";

// Mock IORedis
mock.module("ioredis", () => {
    return mock(() => ({
        on: mock(() => {}),
        get: mock(() => Promise.resolve(null)),
        set: mock(() => Promise.resolve("OK")),
        pipeline: mock(() => ({
            exec: mock(() => Promise.resolve([])),
        })),
    }));
});

mock.module("@kyrazo/shared", () => ({
    logger: {
        info: () => {},
        error: () => {},
        warn: () => {},
        debug: () => {},
    },
}));

describe("RedisConfig", () => {
    let redisConfig: RedisConfig;

    it("should be a singleton", () => {
        const instance1 = RedisConfig.getInstance();
        const instance2 = RedisConfig.getInstance();
        expect(instance1).toBe(instance2);
    });

    it("should provide connection details", () => {
        redisConfig = RedisConfig.getInstance();
        expect(redisConfig.getConnectionStatus()).toBeDefined();
    });
});
