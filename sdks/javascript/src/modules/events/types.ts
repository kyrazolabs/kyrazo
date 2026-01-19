/**
 * Events Module Types
 */

export type {
  EventPriority,
  EventStatus,
  PublishEventPayload,
  PublishEventResponse,
  BatchPublishEventResponseItem,
  BatchPublishEventResponse,
} from "../../types/events";

export type { EventTarget, EventData } from "../../types/common";

/**
 * Options for publishing events
 */
export interface PublishEventOptions {
  /**
   * Idempotency key for preventing duplicate events
   */
  idempotencyKey?: string;
}
