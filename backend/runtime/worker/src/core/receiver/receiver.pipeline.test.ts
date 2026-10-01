import { describe, it, expect, beforeEach, mock } from "bun:test";
import { ReceiverPipeline } from "./receiver.pipeline";

// Mock dependencies
const mockDetector = { detect: mock(() => Promise.resolve()) };

mock.module("./receiver.detector", () => ({ receiverDetector: mockDetector }));
mock.module("@kyrazo/shared", () => ({
    logger: {
        info: () => {},
        error: () => {},
        warn: () => {},
        debug: () => {},
    },
}));

describe("ReceiverPipeline", () => {
    let pipeline: ReceiverPipeline;

    beforeEach(() => {
        pipeline = ReceiverPipeline.getInstance();
    });

    it("should call detector with event", async () => {
        const event = { eventId: "evt_1" };
        await pipeline.process(event);
        expect(mockDetector.detect).toHaveBeenCalledWith(event);
    });
});
