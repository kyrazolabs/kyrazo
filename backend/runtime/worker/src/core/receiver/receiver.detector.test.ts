import { describe, it, expect, beforeEach, mock } from "bun:test";
import { ReceiverDetector } from "./receiver.detector";

// Mock dependencies
const mockPaypalPipeline = { process: mock(() => Promise.resolve()) };
const mockStripePipeline = { process: mock(() => Promise.resolve()) };
const mockRedis = { cache: mock((key, fn) => fn()) };
const mockSource = {
    findById: mock(() => ({
        populate: mock(() =>
            Promise.resolve({
                forwarding: true,
                endpoints: [{ _id: "end_1", url: "http://end.com" }],
            }),
        ),
    })),
};
const mockDispatcherHeaders = { buildHeaders: mock(() => Promise.resolve({})) };
const mockDispatcherQueue = { enqueue: mock(() => Promise.resolve()) };
const mockPaypalTransformer = { transform: mock(() => ({ targets: [{}] })) };

mock.module("./sources/paypal/paypal.pipeline", () => ({
    payPalPipeline: mockPaypalPipeline,
}));
mock.module("./sources/stripe/stripe.pipeline", () => ({
    stripePipeline: mockStripePipeline,
}));
mock.module("@/config", () => ({ redisConfig: mockRedis }));
mock.module("@kyrazo/shared", () => ({
    Source: mockSource,
    logger: {
        info: () => {},
        error: () => {},
        warn: () => {},
        debug: () => {},
    },
}));
mock.module("../dispatcher/dispatcher.headers", () => ({
    dispatcherHeaders: mockDispatcherHeaders,
}));
mock.module("../dispatcher/dispatcher.queue", () => ({
    dispatcherQueue: mockDispatcherQueue,
}));
mock.module("./sources/paypal/paypal.transformer", () => ({
    paypalTransformer: mockPaypalTransformer,
}));

describe("ReceiverDetector", () => {
    let detector: ReceiverDetector;

    beforeEach(() => {
        detector = ReceiverDetector.getInstance();
        mockPaypalPipeline.process.mockClear();
        mockStripePipeline.process.mockClear();
        mockDispatcherQueue.enqueue.mockClear();
    });

    it("should route paypal events", async () => {
        const event = { source: "paypal", sourceId: "src_1", eventId: "evt_1" };

        await detector.detect(event);

        expect(mockPaypalPipeline.process).toHaveBeenCalledWith(event);
        expect(mockDispatcherQueue.enqueue).toHaveBeenCalled();
    });

    it("should skip unknown sources", async () => {
        const event = { source: "unknown" };
        await detector.detect(event);
        expect(mockPaypalPipeline.process).not.toHaveBeenCalled();
    });
});
