import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import dayjs from "dayjs";

// Mock BullMQ
mock.module("bullmq", () => ({
    Queue: mock(() => ({
        add: mock(() => Promise.resolve()),
    })),
    Worker: mock(() => ({
        on: mock(() => {}),
    })),
}));

// Mock Services
const mockS3Upload = mock(() => Promise.resolve({ success: true }));
mock.module("@/services/storage/s3.service", () => ({
    s3Service: {
        upload: mockS3Upload,
    }
}));

// Mock Redis
const mockRedis = {
    get: mock(() => Promise.resolve(null)),
    set: mock(() => Promise.resolve("OK")),
    rpush: mock(() => Promise.resolve(1)),
    lrange: mock(() => Promise.resolve([] as string[])),
    del: mock(() => Promise.resolve(1)),
    exists: mock(() => Promise.resolve(1)),
    rename: mock(() => Promise.resolve("OK")),
    keys: mock(() => Promise.resolve([])),
};

mock.module("@/config", () => ({
    redisConfig: {
        getQueueClient: () => mockRedis,
    }
}));

// Mock Shared/Models
mock.module("@kyrazo/shared", () => ({
    logger: {
        info: mock(() => {}),
        error: mock(() => {}),
        debug: mock(() => {}),
    },
    unprefixId: (id: string) => id.replace('ws_', '').replace('ns_', '').replace('dest_', ''),
    RedisKeys: {
        storage: {
            s3Batch: (id: string, bucket: string) => `storage:batch:s3:${id}:${bucket}`,
        },
        context: {
            s3Bucket: (id: string) => `context:s3-bucket:${id}`,
        }
    },
    S3Bucket: {
        findById: mock(() => ({
            select: mock(() => ({
                lean: mock(() => Promise.resolve({
                    bucketName: "test-bucket",
                    region: "us-east-1",
                    namespaceId: "ns_123",
                    accessKeyId: "key",
                    secretAccessKey: "secret"
                }))
            }))
        }))
    }
}));

import { s3Transport } from "./s3.transport";

describe("S3Transport", () => {
    beforeEach(() => {
        mock.restore();
        for (const m of Object.values(mockRedis)) {
            if (typeof m.mockClear === 'function') m.mockClear();
        }
        mockS3Upload.mockClear();
    });

    it("should buffer events to Redis", async () => {
        const event = { id: "evt_1", data: "test" };
        const targetConfig = { id: "dest_1" };
        
        await s3Transport.buffer(event, targetConfig);
        
        expect(mockRedis.rpush).toHaveBeenCalled();
        const args = (mockRedis.rpush.mock.calls[0] as any);
        expect(args[0]).toContain("storage:batch:s3:1:");
        expect(args[1]).toBe(JSON.stringify(event));
    });

    it("should generate correct Hive paths", () => {
        // Accessing private method via cast for testing logic
        const transport = s3Transport as any;
        const path = transport.generateHivePath("ns_123", "2026-04-18-10");
        
        expect(path).toBe("123/events/year=2026/month=04/day=18/hour=10/");
    });

    it("should flush batches correctly", async () => {
        const transport = s3Transport as any;
        const batchKey = "storage:batch:s3:dest1:2026-04-18-10";
        
        // Mock Redis state for flush
        mockRedis.set.mockResolvedValue("OK"); // Lock acquired
        mockRedis.exists.mockResolvedValue(1); 
        mockRedis.lrange.mockResolvedValue([JSON.stringify({id: 1}), JSON.stringify({id: 2})]);
        
        await transport.flushBatch(batchKey);
        
        // Should have performed atomicity trick (RENAME)
        expect(mockRedis.rename).toHaveBeenCalled();
        
        // Should have uploaded to S3
        expect(mockS3Upload).toHaveBeenCalled();
        const uploadArgs = (mockS3Upload.mock.calls[0] as any);
        expect(uploadArgs[0]).toContain("123/events/year=2026/month=04/day=18/hour=10/batch_");
        expect(uploadArgs[1]).toBe(JSON.stringify({id: 1}) + "\n" + JSON.stringify({id: 2}));
        
        // Should have cleaned up temp key
        expect(mockRedis.del).toHaveBeenCalled();
    });
});
