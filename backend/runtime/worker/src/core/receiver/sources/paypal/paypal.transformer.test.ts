import { describe, it, expect, beforeEach } from "bun:test";
import { PayPalTransformer } from "./paypal.transformer";

describe("PayPalTransformer", () => {
    let transformer: PayPalTransformer;

    beforeEach(() => {
        transformer = PayPalTransformer.getInstance();
    });

    it("should transform PayPal event to IDispatchedEvent", () => {
        const event: any = {
            eventId: "evt_1",
            workspaceId: "ws_1",
            projectId: "proj_1",
            sourceId: "src_1",
            sourceType: "paypal",
            source: "paypal",
            body: {
                id: "pp_1",
                event_type: "PAYMENT.SALE.COMPLETED",
                create_time: "2023-01-01T00:00:00Z",
                resource: { id: "res_1" },
            },
        };
        const endpoints = [
            { _id: "end_1", url: "http://end.com", method: "POST" },
        ];

        const result = transformer.transform(event, endpoints);

        expect(result.id).toBe(event.eventId);
        expect(result.type).toBe("PAYMENT.SALE.COMPLETED");
        expect(result.workspaceId).toBe(event.workspaceId);
        expect(result.targets.length).toBe(1);
        expect(result.targets[0].targetId).toBe("end_1");
        expect(result.provider?.name).toBe("paypal");
        expect(result.provider?.eventId).toBe("pp_1");
    });
});
