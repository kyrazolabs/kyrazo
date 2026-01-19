/**
 * Publish Event Function
 *
 * Publishes a single event to the specified project for webhook delivery.
 *
 * @module modules/dispatch/publish-event
 */

import type { HttpClient } from "../../utils/http";
import { ValidationError } from "../../errors";
import type {
  PublishEventPayload,
  PublishEventResponse,
  PublishEventOptions,
} from "./types";

/**
 * Create the publishEvent function bound to an HTTP client
 * @internal
 */
export function createPublishEvent(httpClient: HttpClient) {
  /**
   * Publish an event to the specified project
   *
   * Sends an event to the Kyrazo API for delivery to the configured webhook targets.
   * The event is queued for asynchronous delivery with automatic retries.
   *
   * @param projectId - The project ID to publish the event to (MongoDB ObjectId format)
   * @param payload - The event configuration and data
   * @param options - Optional configuration including idempotency key
   * @returns Promise resolving to the queued event details
   *
   * @throws {ValidationError} When the payload is missing required fields or has invalid values
   * @throws {AuthenticationError} When the API key is invalid or missing
   * @throws {LimitExceededError} When the monthly event limit is exceeded
   * @throws {RateLimitError} When too many requests are sent in a short period
   * @throws {ServerError} When the server fails to process the event
   *
   * @example Basic usage
   * ```typescript
   * const response = await kyrazo.dispatch.publishEvent("project-123", {
   *   webhookId: "68c674dd3b96f77d9426a93b",
   *   eventType: "user.created",
   *   payload: {
   *     userId: "u_123",
   *     email: "user@example.com",
   *     plan: "pro"
   *   },
   *   targets: [{ targetUrl: "https://example.com/webhook" }]
   * });
   *
   * console.log(`Event ${response.eventId} queued at ${response.queued_at}`);
   * ```
   *
   * @example With priority and retry configuration
   * ```typescript
   * const response = await kyrazo.dispatch.publishEvent("project-123", {
   *   webhookId: "68c674dd3b96f77d9426a93b",
   *   eventType: "payment.completed",
   *   payload: { orderId: "order_456", amount: 99.99 },
   *   targets: [
   *     { targetUrl: "https://primary.example.com/webhook" },
   *     { targetUrl: "https://backup.example.com/webhook" }
   *   ],
   *   meta: {
   *     priority: "high",
   *     maxRetries: 5
   *   }
   * });
   * ```
   */
  return async function publishEvent(
    projectId: string,
    payload: PublishEventPayload,
    options?: PublishEventOptions,
  ): Promise<PublishEventResponse> {
    // Validate projectId
    if (
      !projectId ||
      typeof projectId !== "string" ||
      projectId.trim() === ""
    ) {
      throw new ValidationError(
        "projectId is required and must be a non-empty string",
      );
    }

    // Validate required payload fields
    if (!payload || typeof payload !== "object") {
      throw new ValidationError("payload is required and must be an object");
    }

    const { webhookId, eventType, payload: eventData, targets } = payload;

    if (!webhookId || typeof webhookId !== "string") {
      throw new ValidationError("webhookId is required and must be a string");
    }

    if (!eventType || typeof eventType !== "string") {
      throw new ValidationError("eventType is required and must be a string");
    }

    if (eventData === undefined || eventData === null) {
      throw new ValidationError("payload is required");
    }

    if (!Array.isArray(targets) || targets.length === 0) {
      throw new ValidationError(
        "targets is required and must be a non-empty array",
      );
    }

    // Validate each target
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      if (!target || typeof target !== "object") {
        throw new ValidationError(`targets[${i}] must be an object`);
      }
      if (!target.targetUrl || typeof target.targetUrl !== "string") {
        throw new ValidationError(
          `targets[${i}].targetUrl is required and must be a string`,
        );
      }
      try {
        new URL(target.targetUrl);
      } catch {
        throw new ValidationError(
          `targets[${i}].targetUrl must be a valid URL`,
        );
      }
    }

    // Validate optional meta fields
    if (payload.meta !== undefined) {
      if (typeof payload.meta !== "object") {
        throw new ValidationError("meta must be an object");
      }
      if (payload.meta.priority !== undefined) {
        const validPriorities = ["low", "normal", "high", "urgent"];
        if (!validPriorities.includes(payload.meta.priority)) {
          throw new ValidationError(
            `meta.priority must be one of: ${validPriorities.join(", ")}`,
          );
        }
      }
      if (payload.meta.maxRetries !== undefined) {
        if (
          typeof payload.meta.maxRetries !== "number" ||
          payload.meta.maxRetries < 0 ||
          payload.meta.maxRetries > 10
        ) {
          throw new ValidationError(
            "meta.maxRetries must be a number between 0 and 10",
          );
        }
      }
    }

    // Make the request
    const requestOptions = options?.idempotencyKey
      ? { headers: { "Idempotency-Key": options.idempotencyKey } }
      : undefined;

    const response = await httpClient.post<PublishEventResponse>(
      `/v1/events/${projectId}/publish`,
      payload,
      requestOptions,
    );

    return response.data;
  };
}
