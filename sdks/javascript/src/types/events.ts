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

/**
 * Payload for publishing a single event
 * 
 * @example
 * ```typescript
 * const payload: PublishEventPayload = {
 *   eventType: "user.created",
 *   webhookId: "68c674dd3b96f77d9426a93b",
 *   payload: { userId: "u_123", email: "user@example.com" },
 *   targets: [{ targetUrl: "https://example.com/webhook" }]
 * };
 * ```
 */
export interface PublishEventPayload {
    /**
     * ID of the webhook configuration (MongoDB ObjectId)
     * @required
     */
    webhookId: string;

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
     * Target endpoints to deliver the event to
     * Each target must have a valid `targetUrl`
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
 * const response = await kyrazo.dispatch.publishEvent(projectId, payload);
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
     * NATS subject the event was published to
     */
    subject: string;

    /**
     * NATS stream name
     */
    stream: string;

    /**
     * NATS sequence number
     */
    sequence: number;

    /**
     * Number of targets the event will be delivered to
     */
    targetsCount: number;

    /**
     * ISO 8601 timestamp when the event was queued
     */
    queued_at: string;

    /**
     * Server processing time in milliseconds
     */
    processing_time_ms: number;
}

/**
 * Response item for batch publishing
 */
export interface BatchPublishEventResponseItem {
    /**
     * Status of the individual event
     */
    status: "queued";

    /**
     * Unique identifier for the published event
     */
    eventId: string;

    /**
     * NATS subject the event was published to
     */
    subject: string;

    /**
     * NATS stream name
     */
    stream: string;

    /**
     * NATS sequence number
     */
    sequence: number;

    /**
     * Number of targets for this event
     */
    targetsCount: number;
}

/**
 * Response from batch publishing multiple events
 */
export type BatchPublishEventResponse = BatchPublishEventResponseItem[];

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
    targetId?: string;

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
