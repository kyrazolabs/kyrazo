import { describe, it, expect, beforeEach, mock } from "bun:test";
import { DispatcherQueue } from "./dispatcher.queue";

// Mock dependencies
const mockDispatchConsumer = {
    enqueue: mock(() => Promise.resolve(["job_1"])),
};

const mockRedis = {
    cache: mock((key, fn) => fn()),
};

const mockTargetRepo = {
    getTargetById: mock(() =>
        Promise.resolve({
            _id: "tar_1",
            url: "http://target.com",
            config: { rateLimit: 10, rateLimitDuration: 1, retryCount: 3 },
            method: "POST",
        }),
    ),
};

mock.module("@/consumers/queues/dispatch.consumer", () => ({
    dispatchConsumer: mockDispatchConsumer,
}));

mock.module("@/config", () => ({
    redisConfig: mockRedis,
}));

mock.module("@/services/mongo/target.repo", () => ({
    targetRepository: mockTargetRepo,
}));

mock.module("@kyrazo/shared", () => ({
    logger: {
        info: () => {},
        error: () => {},
        warn: () => {},
        debug: () => {},
    },
}));

describe("DispatcherQueue", () => {
    let queue: DispatcherQueue;

    beforeEach(() => {
        queue = DispatcherQueue.getInstance();
    });

    it("should enqueue tasks to BullMQ", async () => {
        const event: any = {
            id: "evt_1",
            workspaceId: "ws_1",
            projectId: "proj_1",
            targets: [{ targetId: "tar_1" }],
            meta: { priority: "normal" },
        };
        const headers: any = { "X-Test": "Value" };
        const targets = event.targets;

        await queue.enqueue(event, headers, targets);

        expect(mockDispatchConsumer.enqueue).toHaveBeenCalled();
        const callArgs = mockDispatchConsumer.enqueue.mock.calls[0];
        expect(callArgs[0]).toBe(event);
        expect(callArgs[1][0].url).toBe("http://target.com");
        expect(callArgs[1][0].method).toBe("POST");
        expect(callArgs[2]).toBe(headers);
    });
});
