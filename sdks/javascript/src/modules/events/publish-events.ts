/**
 * Batch Publish Events Function
 *
 * Publishes multiple events in a single request for efficient bulk operations.
 *
 * @module modules/dispatch/publish-events
 */

import type { HttpClient } from "../../utils/http";
import { ValidationError } from "../../errors";
import type {
  PublishEventPayload,
  BatchPublishEventResponse,
  PublishEventOptions,
} from "./types";

/** Maximum events per batch request */
const MAX_BATCH_SIZE = 100;

/**
 * Create the publishEvents function bound to an HTTP client
 * @internal
 */
export function createPublishEvents(httpClient: HttpClient) {
  /**
   * Publish multiple events in a single batch request
   *
   * Sends up to 100 events in a single API call for efficient bulk operations.
   * Each event is queued independently for delivery.
   *
   * @param projectId - The project ID to publish events to (MongoDB ObjectId format)
   * @param events - Array of event payloads (max 100 per batch)
   * @param options - Optional configuration including idempotency key
   * @returns Promise resolving to an array of queued event details
   *
   * @throws {ValidationError} When events array is empty, exceeds 100, or contains invalid payloads
   * @throws {AuthenticationError} When the API key is invalid or missing
   * @throws {LimitExceededError} When the monthly event limit is exceeded
   * @throws {RateLimitError} When too many requests are sent in a short period
   * @throws {ServerError} When the server fails to process the events
   *
   * @example Batch publishing multiple events
   * ```typescript
   * const responses = await kyrazo.dispatch.publishEvents("project-123", [
   *   {
   *     webhookId: "68c674dd3b96f77d9426a93b",
   *     eventType: "user.created",
   *     payload: { userId: "u_1" },
   *     targets: [{ targetUrl: "https://example.com/webhook" }]
   *   },
   *   {
   *     webhookId: "68c674dd3b96f77d9426a93b",
   *     eventType: "user.created",
   *     payload: { userId: "u_2" },
   *     targets: [{ targetUrl: "https://example.com/webhook" }]
   *   }
   * ]);
   *
   * console.log(`Published ${responses.length} events`);
   * ```
   */
  return async function publishEvents(
    projectId: string,
    events: PublishEventPayload[],
    options?: PublishEventOptions,
  ): Promise<BatchPublishEventResponse> {
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

    // Validate events array
    if (!Array.isArray(events)) {
      throw new ValidationError("events must be an array");
    }

    if (events.length === 0) {
      throw new ValidationError("events array cannot be empty");
    }

    if (events.length > MAX_BATCH_SIZE) {
      throw new ValidationError(
        `Maximum ${MAX_BATCH_SIZE} events per batch allowed`,
      );
    }

    // Validate each event
    for (let i = 0; i < events.length; i++) {
      const event = events[i];

      if (!event || typeof event !== "object") {
        throw new ValidationError(`events[${i}] must be an object`);
      }

      if (!event.webhookId || typeof event.webhookId !== "string") {
        throw new ValidationError(`events[${i}].webhookId is required`);
      }

      if (!event.eventType || typeof event.eventType !== "string") {
        throw new ValidationError(`events[${i}].eventType is required`);
      }

      if (event.payload === undefined || event.payload === null) {
        throw new ValidationError(`events[${i}].payload is required`);
      }

      if (!Array.isArray(event.targets) || event.targets.length === 0) {
        throw new ValidationError(
          `events[${i}].targets must be a non-empty array`,
        );
      }

      // Validate targets
      for (let j = 0; j < event.targets.length; j++) {
        const target = event.targets[j];
        if (!target?.targetUrl) {
          throw new ValidationError(
            `events[${i}].targets[${j}].targetUrl is required`,
          );
        }
        try {
          new URL(target.targetUrl);
        } catch {
          throw new ValidationError(
            `events[${i}].targets[${j}].targetUrl must be a valid URL`,
          );
        }
      }
    }

    // Make the request
    const requestOptions = options?.idempotencyKey
      ? { headers: { "Idempotency-Key": options.idempotencyKey } }
      : undefined;

    const response = await httpClient.post<BatchPublishEventResponse>(
      `/v1/events/${projectId}/publish/batch`,
      events,
      requestOptions,
    );

    return response.data;
  };
}
