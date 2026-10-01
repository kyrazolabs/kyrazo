/**
 * Queue-related type definitions
 */

/**
 * Dispatch Queue Job Data Interface
 */
export interface IDispatchJobData {
  eventId: string;
  webhookId: string;
  targetId: string;
  targetUrl: string;
  eventData: any;
  headers: Record<string, string>;
  deliveryId: string;
  attemptNumber: number;
  priority: number;
}

/**
 * Retry Queue Job Data Interface
 */
export interface IRetryJobData {
  deliveryId: string;
  eventId: string;
  targetId: string;
  targetUrl: string;
  eventData: any;
  attemptNumber: number;
  maxAttempts: number;
  nextRetryAt: Date;
}

/**
 * Batch Queue Job Data Interface
 */
export interface IBatchJobData {
  batchId: string;
  eventIds: string[];
  operation: string;
  metadata?: Record<string, any>;
}