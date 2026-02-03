import { describe, it, expect, beforeEach } from "bun:test";
import { DispatcherHeaders } from "./dispatcher.headers";

describe("DispatcherHeaders", () => {
    let dispatcherHeaders: DispatcherHeaders;

    beforeEach(() => {
        dispatcherHeaders = DispatcherHeaders.getInstance();
    });

    it("should be a singleton", () => {
        const instance1 = DispatcherHeaders.getInstance();
        const instance2 = DispatcherHeaders.getInstance();
        expect(instance1).toBe(instance2);
    });

    it("should build default headers correctly", async () => {
        const event: any = {
            id: "evt_123",
            type: "test.event",
            timestamp: 1234567890,
            workspaceId: "ws_456",
            projectId: "proj_789",
        };
        const attempt = 1;

        const headers = await dispatcherHeaders.buildHeaders(event, attempt);

        expect(headers["X-Webhook-Id"]).toBe(event.id);
        expect(headers["X-Webhook-Event"]).toBe(event.type);
        expect(headers["X-Webhook-Timestamp"]).toBe(event.timestamp.toString());
        expect(headers["X-Webhook-Workspace"]).toBe(event.workspaceId);
        expect(headers["X-Webhook-Project"]).toBe(event.projectId);
        expect(headers["X-Webhook-Attempt"]).toBe(attempt.toString());
        expect(headers["X-Webhook-Version"]).toBe("v1");
        expect(headers["X-Webhook-Schema"]).toBe("event.v1");
    });
});
