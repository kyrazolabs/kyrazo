import { describe, it, expect } from "vitest";
import { Webhook, ValidationError } from "../src";
import * as crypto from "crypto";

describe("Webhook", () => {
  const secret = "whsec_test_secret";
  const payload = JSON.stringify({ event: "user.created", data: { id: "123" } });
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = "test_nonce_123";
  const version = "v1";

  const computeSignature = (p: string, t: string, n: string, v: string, s: string) => {
    const signedPayload = `${v}.${t}.${n}.${p}`;
    return crypto.createHmac("sha256", s).update(signedPayload).digest("hex");
  };

  it("should verify a valid signature", () => {
    const signature = computeSignature(payload, timestamp, nonce, version, secret);
    const headers = {
      "x-webhook-signature": `v1=${signature}`,
      "x-webhook-timestamp": timestamp,
      "x-webhook-nonce": nonce,
      "x-webhook-version": version,
    };

    expect(Webhook.verify(payload, headers, secret)).toBe(true);
  });

  it("should throw ValidationError for missing headers", () => {
    const headers = {
      "x-webhook-timestamp": timestamp,
    };

    expect(() => Webhook.verify(payload, headers, secret)).toThrow(
      "Missing required webhook headers",
    );
  });

  it("should throw ValidationError for invalid signature", () => {
    const headers = {
      "x-webhook-signature": "v1=invalid_signature",
      "x-webhook-timestamp": timestamp,
      "x-webhook-nonce": nonce,
      "x-webhook-version": version,
    };

    expect(() => Webhook.verify(payload, headers, secret)).toThrow(
      "Webhook signature verification failed",
    );
  });

  it("should throw ValidationError for expired timestamp", () => {
    const oldTimestamp = (Math.floor(Date.now() / 1000) - 600).toString(); // 10 minutes ago
    const signature = computeSignature(payload, oldTimestamp, nonce, version, secret);
    const headers = {
      "x-webhook-signature": `v1=${signature}`,
      "x-webhook-timestamp": oldTimestamp,
      "x-webhook-nonce": nonce,
      "x-webhook-version": version,
    };

    expect(() => Webhook.verify(payload, headers, secret)).toThrow(
      "Webhook timestamp expired or invalid",
    );
  });

  it("should verify with custom tolerance", () => {
    const oldTimestamp = (Math.floor(Date.now() / 1000) - 600).toString(); // 10 minutes ago
    const signature = computeSignature(payload, oldTimestamp, nonce, version, secret);
    const headers = {
      "x-webhook-signature": `v1=${signature}`,
      "x-webhook-timestamp": oldTimestamp,
      "x-webhook-nonce": nonce,
      "x-webhook-version": version,
    };

    expect(Webhook.verify(payload, headers, secret, 1200)).toBe(true);
  });
});
