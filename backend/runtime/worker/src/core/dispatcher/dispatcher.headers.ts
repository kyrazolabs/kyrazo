import type { IDispatchedEvent, IWebhookHeaders } from "./dispatcher.types";

export class DispatcherHeaders {
    static instance: DispatcherHeaders;

    private constructor() {}

    public static getInstance(): DispatcherHeaders {
        if (!DispatcherHeaders.instance) {
            DispatcherHeaders.instance = new DispatcherHeaders();
        }
        return DispatcherHeaders.instance;
    }

    /**
     * Generates secure webhook headers
     */
    public async buildHeaders(
        event: IDispatchedEvent,
        attempt: number,
    ): Promise<IWebhookHeaders> {
        return {
            "X-Webhook-Id": event.id,
            "X-Webhook-Event": event.type,
            "X-Webhook-Timestamp": event.timestamp.toString(), // Default or event timestamp
            "X-Webhook-Workspace": event.workspaceId,
            "X-Webhook-Project": event.projectId,
            "X-Webhook-Attempt": attempt.toString(),
            "X-Webhook-Signature": "", // To be filled by dispatcher worker
            "X-Webhook-Nonce": "", // To be filled by dispatcher worker
            "X-Webhook-Version": "v1",
            "X-Webhook-Schema": "event.v1",
        };
    }
}

export const dispatcherHeaders = DispatcherHeaders.getInstance();
