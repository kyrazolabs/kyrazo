import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createEventsModule,
  type EventsModule,
} from "../../src/modules/events";
import { HttpClient } from "../../src/utils/http";
import {
  RateLimitError,
  AuthenticationError,
  ServerError,
} from "../../src/errors";

describe("EventsModule", () => {
  let events: EventsModule;
  let mockHttpClient: any;

  beforeEach(() => {
    mockHttpClient = {
      post: vi.fn(),
    } as unknown as HttpClient;
    events = createEventsModule(mockHttpClient);
  });

  describe("single()", () => {
    const validEvent = {
      webhookId: "wh_123",
      eventType: "user.created",
      payload: { id: "u_1" },
      targets: [{ targetUrl: "https://example.com" }],
    };

    it("should publish a single event successfully", async () => {
      const mockResponse = {
        data: { eventId: "evt_123", queued_at: "2024-01-01T00:00:00Z" },
      };
      mockHttpClient.post.mockResolvedValue(mockResponse);

      const response = await events.single("proj_123", validEvent);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        "/v1/events/proj_123/publish",
        validEvent,
        undefined,
      );
      expect(response).toEqual(mockResponse.data);
    });

    it("should pass idempotency key in headers", async () => {
      const mockResponse = { data: { eventId: "evt_123" } };
      mockHttpClient.post.mockResolvedValue(mockResponse);

      await events.single("proj_123", validEvent, {
        idempotencyKey: "unique-key",
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        "/v1/events/proj_123/publish",
        validEvent,
        { headers: { "Idempotency-Key": "unique-key" } },
      );
    });

    it("should handle error responses from client", async () => {
      mockHttpClient.post.mockRejectedValue(
        new AuthenticationError("Invalid API Key"),
      );

      await expect(events.single("proj_123", validEvent)).rejects.toThrow(
        AuthenticationError,
      );
    });

    it("should handle rate limit errors with retry-after", async () => {
      const rateLimitError = new RateLimitError("Too Many Requests", 30);
      mockHttpClient.post.mockRejectedValue(rateLimitError);

      try {
        await events.single("proj_123", validEvent);
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError);
        expect((error as RateLimitError).retryAfter).toBe(30);
      }
    });
  });

  describe("batch()", () => {
    const validEvents = [
      {
        webhookId: "wh_1",
        eventType: "e1",
        payload: { id: 1 },
        targets: [{ targetUrl: "https://u1.com" }],
      },
      {
        webhookId: "wh_2",
        eventType: "e2",
        payload: { id: 2 },
        targets: [{ targetUrl: "https://u2.com" }],
      },
    ];

    it("should publish batch events successfully", async () => {
      const mockResponse = { data: [{ eventId: "e1" }, { eventId: "e2" }] };
      mockHttpClient.post.mockResolvedValue(mockResponse);

      const response = await events.batch("proj_123", validEvents);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        "/v1/events/proj_123/publish/batch",
        validEvents,
        undefined,
      );
      expect(response).toEqual(mockResponse.data);
    });

    it("should pass idempotency key for batch", async () => {
      mockHttpClient.post.mockResolvedValue({ data: [] });

      await events.batch("proj_123", validEvents, {
        idempotencyKey: "batch-key",
      });

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        "/v1/events/proj_123/publish/batch",
        validEvents,
        { headers: { "Idempotency-Key": "batch-key" } },
      );
    });
  });
});
