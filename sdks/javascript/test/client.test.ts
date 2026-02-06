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
        eventType: "test.event",
        payload: {},
        targets: [{ targetId: "target-123" }],
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should validate eventType is required", async () => {
    await expect(
      client.events.single("project-123", {
        eventType: "",
        payload: {},
        targets: [{ targetId: "target-123" }],
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should validate targets is required", async () => {
    await expect(
      client.events.single("project-123", {
        eventType: "test.event",
        payload: {},
        targets: [],
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("should validate targetId is required", async () => {
    await expect(
      client.events.single("project-123", {
        eventType: "test.event",
        payload: {},
        targets: [{ targetId: "" }],
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
      eventType: "test.event",
      payload: {},
      targets: [{ targetId: "target-123" }],
    });
    await expect(client.events.batch("project-123", events)).rejects.toThrow(
      ValidationError,
    );
  });
});
