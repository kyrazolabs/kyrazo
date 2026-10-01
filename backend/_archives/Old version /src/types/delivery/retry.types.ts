export enum RetryStrategy {
  EXPONENTIAL = 'exponential',
  LINEAR = 'linear',
  FIXED = 'fixed'
}

export enum RetryStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface IRetryConfig {
  maxAttempts: number;
  strategy: RetryStrategy;
  initialDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  jitter: boolean; // Add random jitter to prevent thundering herd
}

export interface IRetryAttempt {
  attemptId: string;
  deliveryId: string;
  eventId: string;
  targetId: string;
  attemptNumber: number;
  scheduledAt: Date;
  executedAt?: Date;
  status: RetryStatus;
  error?: string;
  delayMs: number;
}

export interface IRetryQueueItem {
  deliveryId: string;
  eventId: string;
  targetId: string;
  targetUrl: string;
  eventData: any;
  attemptNumber: number;
  nextRetryAt: Date;
  maxAttempts: number;
  priority: number;
}

export interface IRetryStats {
  totalRetries: number;
  successfulRetries: number;
  failedRetries: number;
  averageRetryTime: number;
  retrySuccessRate: number;
}