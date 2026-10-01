import { describe, it, expect, beforeEach, mock } from "bun:test";
import { DispatcherSignature } from "./dispatcher.signature";

// Mock dependencies
const mockRedis = {
    cache: mock((key, fn) => fn()),
};

const mockTarget = {
    findOne: mock(() => ({
        select: mock(() => ({
            lean: mock(() =>
                Promise.resolve({
                    secrets: [{ active: true, value_enc: 'enc', iv: 'iv' }],
                })
            ),
        })),
    })),
};

const mockSecretCrypto = {
    decrypt: mock(() => "decrypted_secret"),
};

mock.module("@/config", () => ({
    redisConfig: mockRedis,
}));

mock.module("@kyrazo/shared", () => ({
    Target: mockTarget,
    Endpoint: {},
    secretCrypto: mockSecretCrypto,
    logger: { info: () => {}, error: () => {}, debug: () => {} },
}));

describe("DispatcherSignature", () => {
    let signature: DispatcherSignature;

    beforeEach(() => {
        signature = DispatcherSignature.getInstance();
    });

    it("should sign a body correctly", async () => {
        const body = { test: true };
        const result = await signature.sign(body, "ws_1", "proj_1", "tar_1");

        expect(result.signature).toBeDefined();
        expect(result.timestamp).toBeDefined();
        expect(result.nonce).toBeDefined();
        expect(result.version).toBe("v1");
    });

    it("should build headers correctly", async () => {
        const signResult = {
            signature: "sig",
            timestamp: 1234,
            nonce: "nonce",
            version: "v1",
        };

        const headers = await signature.buildHeaders(signResult);

        expect(headers["X-Webhook-Signature"]).toBe("v1=sig");
        expect(headers["X-Webhook-Timestamp"]).toBe("1234");
        expect(headers["X-Webhook-Nonce"]).toBe("nonce");
        expect(headers["X-Webhook-Version"]).toBe("v1");
    });

    it("should verify a valid signature", () => {
        const secret = "my_secret";
        const body = { hello: "world" };
        const timestamp = Date.now();
        const nonce = "nonce123";
        const version = "v1";

        // Create a real signature to test verification
        const crypto = require("crypto");
        const dataToSign = `${version}.${timestamp}.${nonce}.${JSON.stringify(body)}`;
        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(dataToSign)
            .digest("hex");

        const isValid = signature.verify(
            body,
            expectedSignature,
            timestamp,
            nonce,
            version,
            secret,
        );
        expect(isValid).toBe(true);
    });
});
