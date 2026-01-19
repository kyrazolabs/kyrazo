import { describe, it, expect, vi, beforeEach } from "vitest";
import { Kyrazo, ValidationError } from "../src";

describe("Kyrazo Client", () => {
  it("should create client with required config", () => {
    const client = new Kyrazo({
      apiKey: "test-key",
      baseURL: "http://localhost:4000",
    });
    expect(client).toBeDefined();
    expect(client.events).toBeDefined();
    expect(client.sources).toBeDefined();
    expect(client.endpoints).toBeDefined();
    expect(client.targets).toBeDefined();
  });

  it("should throw ValidationError for missing apiKey", () => {
    expect(() => new Kyrazo({ apiKey: "" })).toThrow(ValidationError);
  });
});

describe("Events.single()", () => {
  let client: Kyrazo;

  beforeEach(() => {
    client = new Kyrazo({
      apiKey: "test-key",
      baseURL: "http://localhost:4000",
    });
  });

  it("should validate projectId is required", async () => {
    await expect(
      client.events.single("", {
        webhookId: "webhook-123",
        eventType: "test.event",
        payload: {},
        targets: [{ targetUrl: "https://example.com" }],
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should validate webhookId is required", async () => {
    await expect(
      client.events.single("project-123", {
        webhookId: "",
        eventType: "test.event",
        payload: {},
        targets: [{ targetUrl: "https://example.com" }],
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should validate targets is required", async () => {
    await expect(
      client.events.single("project-123", {
        webhookId: "webhook-123",
        eventType: "test.event",
        payload: {},
        targets: [],
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should validate target URL is valid", async () => {
    await expect(
      client.events.single("project-123", {
        webhookId: "webhook-123",
        eventType: "test.event",
        payload: {},
        targets: [{ targetUrl: "not-a-url" }],
      }),
    ).rejects.toThrow(ValidationError);
  });
});

describe("Events.batch()", () => {
  let client: Kyrazo;

  beforeEach(() => {
    client = new Kyrazo({
      apiKey: "test-key",
      baseURL: "http://localhost:4000",
    });
  });

  it("should validate events array is not empty", async () => {
    await expect(client.events.batch("project-123", [])).rejects.toThrow(
      ValidationError,
    );
  });

  it("should validate max batch size", async () => {
    const events = Array(101).fill({
      webhookId: "webhook-123",
      eventType: "test.event",
      payload: {},
      targets: [{ targetUrl: "https://example.com" }],
    });
    await expect(client.events.batch("project-123", events)).rejects.toThrow(
      ValidationError,
    );
  });
});
