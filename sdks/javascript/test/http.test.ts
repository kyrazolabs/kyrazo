import { describe, it, expect, vi, beforeEach } from "vitest";
import { HttpClient } from "../src/utils/http";

describe("HttpClient Idempotency", () => {
  const config = {
    apiKey: "test-key",
    baseURL: "http://localhost:4000",
    timeout: 5000,
    maxRetries: 3,
  };

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("should automatically include Idempotency-Key header", async () => {
    const httpClient = new HttpClient(config);
    (fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve({ success: true }),
      text: () => Promise.resolve('{"success":true}'),
    });

    await httpClient.post("/test");

    const fetchCall = (fetch as any).mock.calls[0];
    const headers = fetchCall[1].headers;

    expect(headers["Idempotency-Key"]).toBeDefined();
    expect(headers["Idempotency-Key"]).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("should allow overriding Idempotency-Key header", async () => {
    const httpClient = new HttpClient(config);
    (fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve({ success: true }),
      text: () => Promise.resolve('{"success":true}'),
    });

    const customKey = "custom-key-123";
    await httpClient.post(
      "/test",
      {},
      { headers: { "Idempotency-Key": customKey } },
    );

    const fetchCall = (fetch as any).mock.calls[0];
    const headers = fetchCall[1].headers;

    expect(headers["Idempotency-Key"]).toBe(customKey);
  });
});
