import { describe, it, expect, mock, beforeEach } from "bun:test";

// Mock AWS SDK
const mockSend = mock(() => Promise.resolve({ MessageId: "msg-123" }));

mock.module("@aws-sdk/client-sqs", () => ({
    SQSClient: mock(() => ({
        send: mockSend,
    })),
    SendMessageCommand: mock((args) => args),
}));

mock.module("@kyrazo/shared", () => ({
    logger: {
        debug: mock(() => {}),
        error: mock(() => {}),
    }
}));

import { SQSService } from "./sqs.service";

describe("SQSService", () => {
    let sqsService: SQSService;

    beforeEach(() => {
        sqsService = SQSService.getInstance();
        mockSend.mockClear();
    });

    it("should be a singleton", () => {
        const instance1 = SQSService.getInstance();
        const instance2 = SQSService.getInstance();
        expect(instance1).toBe(instance2);
    });

    it("should send message successfully", async () => {
        const result = await sqsService.send("hello", {
            queueUrl: "https://sqs.us-east-1.amazonaws.com/123/test",
            region: "us-east-1",
            accessKeyId: "key",
            secretAccessKey: "secret",
        });

        expect(result.success).toBe(true);
        expect(result.messageId).toBe("msg-123");
        expect(mockSend).toHaveBeenCalled();
    });

    it("should handle FIFO parameters", async () => {
        await sqsService.send("hello", {
            queueUrl: "queue.fifo",
            region: "us-east-1",
            accessKeyId: "key",
            secretAccessKey: "secret",
            messageGroupId: "group1",
            messageDeduplicationId: "dedup1",
        });

        const lastCallArgs = (mockSend.mock.calls[0] as any)[0];
        expect(lastCallArgs.MessageGroupId).toBe("group1");
        expect(lastCallArgs.MessageDeduplicationId).toBe("dedup1");
    });

    it("should return success: false when SQS fails", async () => {
        mockSend.mockImplementationOnce(() => Promise.reject(new Error("SQS Error")));

        const result = await sqsService.send("hello", {
            queueUrl: "url",
            region: "region",
            accessKeyId: "key",
            secretAccessKey: "secret",
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe("SQS Error");
    });
});
