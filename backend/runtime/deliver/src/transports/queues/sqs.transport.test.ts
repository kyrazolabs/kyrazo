import { describe, it, expect, mock, beforeEach } from "bun:test";

// Mock Services
const mockSqsSend = mock(() => Promise.resolve({ success: true, messageId: "msg-123" }));
mock.module("@/services/queues/sqs.service", () => ({
    sqsService: {
        send: mockSqsSend,
    }
}));

mock.module("@kyrazo/shared", () => ({
    logger: {
        debug: mock(() => {}),
        error: mock(() => {}),
    },
    unprefixId: (id: string) => id.replace('ws_', '').replace('ns_', ''),
}));

import { sqsTransport } from "./sqs.transport";

describe("SQSTransport", () => {
    beforeEach(() => {
        mockSqsSend.mockClear();
    });

    it("should send event to SQS with correct attributes", async () => {
        const event = {
            id: "evt_1",
            type: "user.signed_up",
            workspaceId: "ws_abc",
            data: { email: "test@example.com" }
        };
        const targetConfig = {
            queueUrl: "https://sqs.url",
            region: "us-east-1",
            accessKeyId: "key",
            secretAccessKey: "secret",
            queueType: "standard"
        };

        const result = await sqsTransport.send(event, targetConfig);

        expect(result.success).toBe(true);
        expect(mockSqsSend).toHaveBeenCalled();
        
        const sendOptions = (mockSqsSend.mock.calls[0] as any)[1];
        expect(sendOptions.messageAttributes["Kyrazo-Event-Id"]).toBe("evt_1");
        expect(sendOptions.messageAttributes["Kyrazo-Event-Type"]).toBe("user.signed_up");
    });

    it("should handle FIFO queue parameters", async () => {
        const event = {
            id: "evt_fifo_1",
            type: "order.created",
            workspaceId: "ws_abc",
        };
        const targetConfig = {
            queueUrl: "queue.fifo",
            region: "us-east-1",
            accessKeyId: "key",
            secretAccessKey: "secret",
            queueType: "fifo"
        };

        await sqsTransport.send(event, targetConfig);

        const sendOptions = (mockSqsSend.mock.calls[0] as any)[1];
        expect(sendOptions.messageGroupId).toBe("abc");
        expect(sendOptions.messageDeduplicationId).toBe("evt_fifo_1");
    });
});
