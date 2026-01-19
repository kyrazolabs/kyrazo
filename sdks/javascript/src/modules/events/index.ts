/**
 * Dispatch Module
 *
 * Event publishing and dispatch operations for the Kyrazo SDK.
 * This module provides methods to publish single or batch events
 * for webhook delivery.
 *
 * @module modules/dispatch
 *
 * @example
 * ```typescript
 * // Access via the Kyrazo client
 * const kyrazo = new Kyrazo({ apiKey: "your-key" });
 *
 * // Publish a single event
 * await kyrazo.events.single(projectId, payload);
 *
 * // Publish multiple events in batch
 * await kyrazo.events.batch(projectId, [payload1, payload2]);
 * ```
 */

import type { HttpClient } from "../../utils/http";
import { createPublishEvent } from "./publish-event";
import { createPublishEvents } from "./publish-events";

// Re-export types
export type {
  EventPriority,
  EventStatus,
  PublishEventPayload,
  PublishEventResponse,
  BatchPublishEventResponseItem,
  BatchPublishEventResponse,
} from "./types";

export type { EventTarget, EventData } from "../../types/common";

/**
 * Events module interface
 *
 * Provides methods for publishing events to webhook targets.
 */
export interface EventsModule {
  /**
   * Publish a single event to the specified project
   *
   * @see {@link createPublishEvent} for full documentation
   */
  single: ReturnType<typeof createPublishEvent>;

  /**
   * Publish multiple events in a single batch request (max 100)
   *
   * @see {@link createPublishEvents} for full documentation
   */
  batch: ReturnType<typeof createPublishEvents>;
}

/**
 * Create the dispatch module with all event publishing methods
 *
 * @param httpClient - HTTP client instance for making API requests
 * @returns Events module with all methods bound to the client
 * @internal
 */
export function createEventsModule(httpClient: HttpClient): EventsModule {
  return {
    single: createPublishEvent(httpClient),
    batch: createPublishEvents(httpClient),
  };
}
