import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { HttpClient } from "../src/utils/http";

describe("HttpClient Retry Logic", () => {
  const config = {
    apiKey: "test-key",
    baseURL: "http://localhost:4000",
    timeout: 5000,
    maxRetries: 2,
  };

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("should retry on 500 errors with exponential backoff", async () => {
    const httpClient = new HttpClient(config);
    // Mock delay to avoid real waiting and timer issues
    (httpClient as any).delay = vi.fn().mockResolvedValue(undefined);
    
    let attempts = 0;

    (fetch as any).mockImplementation(() => {
      attempts++;
      if (attempts < 3) {
        return Promise.resolve({
          ok: false,
          status: 500,
          headers: new Headers({ "content-type": "application/json" }),
          json: () => Promise.resolve({ error: { code: "SERVER_ERROR", message: "Failed" } }),
          text: () => Promise.resolve('{"error":{"code":"SERVER_ERROR"}}'),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: () => Promise.resolve({ success: true }),
      });
    });

    const response = await httpClient.get("/test");

    expect(response.status).toBe(200);
    expect(attempts).toBe(3);
    expect((httpClient as any).delay).toHaveBeenCalledTimes(2);
    // Verify backoff intervals
    expect((httpClient as any).delay).toHaveBeenNthCalledWith(1, 100);
    expect((httpClient as any).delay).toHaveBeenNthCalledWith(2, 200);
  });

  it("should retry on 429 errors", async () => {
    const httpClient = new HttpClient(config);
    (httpClient as any).delay = vi.fn().mockResolvedValue(undefined);
    
    let attempts = 0;

    (fetch as any).mockImplementation(() => {
      attempts++;
      if (attempts === 1) {
        return Promise.resolve({
          ok: false,
          status: 429,
          headers: new Headers({ "content-type": "application/json" }),
          json: () => Promise.resolve({ error: { code: "RATE_LIMIT_EXCEEDED", message: "Too fast" } }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: () => Promise.resolve({ success: true }),
      });
    });

    const response = await httpClient.get("/test");

    expect(response.status).toBe(200);
    expect(attempts).toBe(2);
    expect((httpClient as any).delay).toHaveBeenCalledTimes(1);
  });

  it("should reuse the same Idempotency-Key across retries", async () => {
    const httpClient = new HttpClient(config);
    (httpClient as any).delay = vi.fn().mockResolvedValue(undefined);
    
    const idempotencyKeys: string[] = [];

    (fetch as any).mockImplementation((_url: string, options: any) => {
      idempotencyKeys.push(options.headers["Idempotency-Key"]);
      return Promise.resolve({
        ok: false,
        status: 500,
        headers: new Headers({ "content-type": "application/json" }),
        json: () => Promise.resolve({ error: { code: "INTERNAL_ERROR" } }),
        text: () => Promise.resolve('{"error":{"code":"INTERNAL_ERROR"}}'),
      });
    });

    await expect(httpClient.post("/test")).rejects.toThrow();

    expect(idempotencyKeys.length).toBe(3); // Attempt 0, 1, 2
    expect(idempotencyKeys[0]).toBe(idempotencyKeys[1]);
    expect(idempotencyKeys[1]).toBe(idempotencyKeys[2]);
    expect(idempotencyKeys[0]).toMatch(/^[0-9a-f-]{36}$/);
  });
});
