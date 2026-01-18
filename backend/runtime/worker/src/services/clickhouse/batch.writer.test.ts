import { describe, it, expect, mock, beforeAll } from "bun:test";
import { BatchWriter } from "./batch.writer";
import { DeliveryRepo, IngestRepo, secretCrypto } from "@kyrazo/shared";

// Mock repositories
mock.module("@kyrazo/shared", () => ({
    DeliveryRepo: {
        insert: mock(() => Promise.resolve()),
    },
    IngestRepo: {
        insert: mock(() => Promise.resolve()),
    },
    secretCrypto: {
        encrypt: (projectId: string, text: string) => ({
            iv: "mock_iv",
            encrypted: `encrypted_${text}`,
        }),
    },
    logger: {
        info: () => {},
        error: () => {},
    },
}));

describe("BatchWriter", () => {
    let batchWriter: BatchWriter;

    beforeAll(() => {
        batchWriter = BatchWriter.getInstance();
    });

    it("should encrypt delivery attempts before saving", async () => {
        const attempts: any[] = [
            {
                project_id: "proj_1",
                request_body: "req_body",
                request_header: "req_header",
                response_body: "res_body",
                response_header: "res_header",
                delivery_id: "del_1",
            },
        ];

        await batchWriter.saveBatchedDeliveryAttempts(attempts);

        expect(DeliveryRepo.insert).toHaveBeenCalledWith([
            {
                project_id: "proj_1",
                request_body: "mock_iv:encrypted_req_body",
                request_header: "mock_iv:encrypted_req_header",
                response_body: "mock_iv:encrypted_res_body",
                response_header: "mock_iv:encrypted_res_header",
                delivery_id: "del_1",
            },
        ]);
    });

    it("should encrypt ingest events before saving", async () => {
        const events: any[] = [
            {
                project_id: "proj_1",
                headers: "headers",
                body: "body",
                event_id: "evt_1",
            },
        ];

        await batchWriter.saveBatchedIngestEvents(events);

        expect(IngestRepo.insert).toHaveBeenCalledWith([
            {
                project_id: "proj_1",
                headers: "mock_iv:encrypted_headers",
                body: "mock_iv:encrypted_body",
                event_id: "evt_1",
            },
        ]);
    });
});
