import { describe, it, expect, beforeEach, mock } from "bun:test";
import { DispatcherPipeline } from "./dispatcher.pipeline";

// Mock dependencies
const mockValidator = {
    validate: mock(() => true),
    shouldProcess: mock(() => true),
};

const mockTransformer = {
    transform: mock(() => ({
        id: "evt_1",
        workspaceId: "ws_1",
        projectId: "proj_1",
        targets: [{ targetId: "tar_1" }],
    })),
};

const mockHeaders = {
    buildHeaders: mock(() => Promise.resolve({ "X-Webhook-Id": "evt_1" })),
};

const mockQueue = {
    enqueue: mock(() => Promise.resolve()),
};

const mockRedisClient = {
    set: mock(() => Promise.resolve(true)),
};
const mockRedis = {
    getQueueClient: mock(() => mockRedisClient),
};

mock.module("./dispatcher.validator", () => ({
    dispatcherValidator: mockValidator,
}));
mock.module("./dispatcher.transformer", () => ({
    dispatcherTransformer: mockTransformer,
}));
mock.module("./dispatcher.headers", () => ({ dispatcherHeaders: mockHeaders }));
mock.module("./dispatcher.queue", () => ({ dispatcherQueue: mockQueue }));
mock.module("@/config", () => ({ redisConfig: mockRedis }));
mock.module("@kyrazo/shared", () => ({
    logger: {
        info: () => {},
        error: () => {},
        warn: () => {},
        debug: () => {},
    },
}));

describe("DispatcherPipeline", () => {
    let pipeline: DispatcherPipeline;

    beforeEach(() => {
        pipeline = new DispatcherPipeline();
        mockValidator.validate.mockClear();
        mockValidator.shouldProcess.mockClear();
        mockTransformer.transform.mockClear();
        mockHeaders.buildHeaders.mockClear();
        mockQueue.enqueue.mockClear();
        mockRedisClient.set.mockClear();
    });

    it("should process valid publish event", async () => {
        const messageData = {
            eventId: "evt_1",
            sourceType: "internal",
        };

        await pipeline.process(messageData);

        expect(mockValidator.validate).toHaveBeenCalledWith(messageData);
        expect(mockTransformer.transform).toHaveBeenCalledWith(messageData);
        expect(mockHeaders.buildHeaders).toHaveBeenCalled();
        expect(mockQueue.enqueue).toHaveBeenCalled();
    });

    it("should skip invalid event", async () => {
        mockValidator.validate.mockReturnValueOnce(false);
        const messageData = { eventId: "evt_bad" };

        await pipeline.process(messageData);

        expect(mockTransformer.transform).not.toHaveBeenCalled();
    });

    it("should skip duplicate events", async () => {
        const mockRedisClient = mockRedis.getQueueClient();
        (mockRedisClient.set as any).mockReturnValueOnce(false); // set returns null or false if NX fails

        const messageData = { eventId: "evt_dup" };

        await pipeline.process(messageData);

        expect(mockValidator.validate).toHaveBeenCalled();
        expect(mockTransformer.transform).not.toHaveBeenCalled();
    });
});
