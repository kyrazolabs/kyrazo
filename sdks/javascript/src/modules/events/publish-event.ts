/**
 * Publish Event Function
 *
 * Publishes a single event to the specified namespace for webhook delivery.
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
   * Publish an event to the specified namespace
   *
   * Sends an event to the Kyrazo API for delivery to the configured webhook targets.
   * The event is queued for asynchronous delivery with automatic retries.
   *
   * @param namespaceId - The namespace ID to publish the event to (MongoDB ObjectId format)
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
   * const response = await kyrazo.events.single("namespace-123", {
   *   eventType: "user.created",
   *   payload: {
   *     userId: "u_123",
   *     email: "user@example.com",
   *     plan: "pro"
   *   },
   *   targets: [{ targetId: "65a1b2c3d4e5f67890123456" }]
   * });
   *
   * console.log(`Event ${response.eventId} queued at ${response.queuedAt}`);
   * ```
   *
   * @example With targetId
   * ```typescript
   * const response = await kyrazo.events.single("namespace-123", {
   *   eventType: "payment.completed",
   *   payload: { orderId: "order_456", amount: 99.99 },
   *   targets: [
   *     { targetId: "65a1b2c3d4e5f67890123456" }
   *   ]
  * });

   * ```
   */
  return async function publishEvent(
    namespaceId: string,
    payload: PublishEventPayload,
    options?: PublishEventOptions,
  ): Promise<PublishEventResponse> {
    // Validate namespaceId
    if (
      !namespaceId ||
      typeof namespaceId !== "string" ||
      namespaceId.trim() === ""
    ) {
      throw new ValidationError(
        "namespaceId is required and must be a non-empty string",
      );
    }

    // Validate required payload fields
    if (!payload || typeof payload !== "object") {
      throw new ValidationError("payload is required and must be an object");
    }

    const { eventType, payload: eventData, targets } = payload;

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
      if (!target.targetId || typeof target.targetId !== "string") {
        throw new ValidationError(
          `targets[${i}].targetId is required and must be a string`,
        );
      }
    }

    // Make the request
    const requestOptions = options?.idempotencyKey
      ? { headers: { "Idempotency-Key": options.idempotencyKey } }
      : undefined;

    const response = await httpClient.post<PublishEventResponse>(
      `/v1/events/${namespaceId}/publish`,
      payload,
      requestOptions,
    );

    return response.data;
  };
}
