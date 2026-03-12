/**
 * Dispatch Module Types
 *
 * Type definitions for event publishing and dispatch operations.
 * All types are aligned with the backend API response shapes.
 *
 * @module types/dispatch
 */

import type { EventData, EventTarget, Timestamps } from "./common";

/**
 * Priority levels for event processing
 */
export type EventPriority = "low" | "normal" | "high" | "urgent";

/**
 * Possible event status values
 */
export type EventStatus =
  | "pending"
  | "processing"
  | "delivered"
  | "failed"
  | "retrying"
  | "timeout"
  | "network_error";

export interface PublishEventPayload {
  /**
   * Type of the event (e.g., "user.created", "order.completed")
   * Should follow the format "resource.action"
   * @required
   */
  eventType: string;

  /**
   * Event payload data - can be any JSON-serializable object
   * @required
   */
  payload: EventData;

  /**
   * Optional previous state of the resource
   */
  previous?: any;

  /**
   * Target endpoints to deliver the event to
   * At least one target is required
   * @required
   */
  targets: EventTarget[];

  /**
   * Optional event metadata for processing configuration
   */
  meta?: {
    /**
     * Event priority level
     * @default "normal"
     */
    priority?: EventPriority;

    /**
     * Maximum retry attempts (0-10)
     * @default 3
     */
    maxRetries?: number;
  };
}

/**
 * Response from publishing a single event
 *
 * This matches the backend controller's response shape exactly.
 *
 * @example
 * ```typescript
 * const response = await kyrazo.dispatch.publishEvent(namespaceId, payload);
 * console.log(`Event ${response.eventId} queued at ${response.queued_at}`);
 * console.log(`Processing took ${response.processing_time_ms}ms`);
 * ```
 */
export interface PublishEventResponse {
  /**
   * Status of the event (always "queued" on success)
   */
  status: "queued";

  /**
   * Unique identifier for the published event
   */
  eventId: string;

  /**
   * Number of targets the event will be delivered to
   */
  targetsCount: number;

  /**
   * Array of target IDs that could not be found
   */
  unfoundTargets: string[];

  /**
   * ISO 8601 timestamp when the event was queued
   */
  queuedAt: string;

  /**
   * Server processing time in milliseconds
   */
  processingTimeMs: number;
}

/**
 * Response item for batch publishing
 */
export interface BatchPublishEventResponseItem {
  /**
   * Status of the individual event
   */
  status: "queued" | "skipped" | "failed";

  /**
   * Unique identifier for the published event
   */
  eventId: string;

  /**
   * Number of targets for this event
   */
  targetsCount: number;

  /**
   * Optional array of unfound target IDs for this event
   */
  unfoundTargets?: string[];

  /**
   * Optional error message if the event failed to publish
   */
  error?: string;
}

/**
 * Response from batch publishing multiple events
 */
export interface BatchPublishEventResponse {
  /** Overall batch status */
  status: "queued" | "failed" | "skipped";

  /** Total number of events in the batch */
  batchSize: number;

  /** Number of successfully queued events */
  queuedCount: number;

  /** Number of skipped events (e.g., no valid targets) */
  skippedCount: number;

  /** Number of events that failed to publish */
  failedCount: number;

  /** Individual event results */
  results: BatchPublishEventResponseItem[];

  /** ISO 8601 timestamp when the batch was processed */
  queuedAt: string;

  /** Server processing time in milliseconds */
  processingTimeMs: number;
}

/**
 * Full event entity with all fields
 */
export interface Event extends Timestamps {
  /** Unique event ID */
  id: string;

  /** Event ID (alternative field name) */
  eventId: string;

  /** Workspace the event belongs to */
  workspaceId: string;

  /** Associated webhook configuration ID */
  webhookId: string;

  /** Producer identifier */
  producerId: string;

  /** Event type (e.g., "user.created") */
  eventType: string;

  /** Event timestamp as Unix milliseconds */
  timestamp: number;

  /** Event payload data */
  data: EventData;

  /** Target endpoints */
  targets: EventTargetWithStatus[];

  /** Event metadata */
  meta: {
    priority: EventPriority;
    maxRetries: number;
    insertedAt: string;
  };
}

/**
 * Event target with delivery status
 */
export interface EventTargetWithStatus extends EventTarget {
  /** Target identifier */
  targetId: string;

  /** Current delivery status */
  status?: EventStatus;

  /** Number of delivery attempts */
  attempts?: number;

  /** Last attempt timestamp */
  lastAttemptAt?: string | null;

  /** Next retry timestamp */
  nextRetryAt?: string | null;

  /** HTTP response code from target */
  responseCode?: number;

  /** Response body from target */
  responseBody?: Record<string, unknown>;

  /** Response time in milliseconds */
  responseTimeMs?: number;

  /** Error message if delivery failed */
  errorMessage?: string;
}

/**
 * Parameters for listing events
 *
 * @example
 * ```typescript
 * const params: ListEventsParams = {
 *   page: 1,
 *   limit: 20,
 *   status: "delivered",
 *   eventType: "user.created"
 * };
 * ```
 */
export interface ListEventsParams {
  /** Page number (1-indexed) */
  page?: number;

  /** Items per page (max 100) */
  limit?: number;

  /** Filter by event status */
  status?: EventStatus;

  /** Filter by event type */
  eventType?: string;

  /** Filter events from this date (ISO 8601) */
  from?: string;

  /** Filter events to this date (ISO 8601) */
  to?: string;
}

/**
 * Response from listing events
 */
export interface ListEventsResponse {
  /** Array of events */
  events: Event[];

  /** Pagination metadata */
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
