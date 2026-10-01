import { config } from '../app.config';

/**
 * Queue Configuration for BullMQ
 */
export const QUEUE_CONFIG = {
  // Main dispatch queue for event delivery
  DISPATCH_QUEUE: {
    name: 'event-dispatch',
    concurrency: config.worker.concurrency || 5,
    redis: {
      host: config.redis.queue.host,
      port: config.redis.queue.port,
      password: config.redis.queue.password,
      db: config.redis.queue.db,
    },
    defaultJobOptions: {
      removeOnComplete: 100, // Keep last 100 completed jobs
      removeOnFail: 50,     // Keep last 50 failed jobs
      attempts: 3,          // Default attempts (will be overridden per job based on event.meta.maxRetries)
      backoff: {
        type: 'exponential',
        delay: 2000,        // Start with 2 seconds
      },
    },
  },

  // Retry queue for failed deliveries
  RETRY_QUEUE: {
    name: 'event-retry',
    concurrency: Math.min(config.worker.concurrency || 5, 3), // Max 3 concurrent retries
    redis: {
      host: config.redis.queue.host,
      port: config.redis.queue.port,
      password: config.redis.queue.password,
      db: config.redis.queue.db,
    },
    defaultJobOptions: {
      removeOnComplete: 50,
      removeOnFail: 25,
      attempts: 1, // More attempts for retries
      backoff: {
        type: 'exponential',
        delay: 5000, // Start with 5 seconds for retries
      },
    },
  },

  // Batch processing queue for bulk operations
  BATCH_QUEUE: {
    name: 'event-batch',
    concurrency: 2, // Only 2 concurrent batch operations
    redis: {
      host: config.redis.queue.host,
      port: config.redis.queue.port,
      password: config.redis.queue.password,
      db: config.redis.queue.db,
    },
    defaultJobOptions: {
      removeOnComplete: 20,
      removeOnFail: 10,
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 10000, // 10 seconds for batch operations
      },
    },
  },
} as const;

/**
 * Queue Names
 */
export const QUEUE_NAMES = {
  DISPATCH: QUEUE_CONFIG.DISPATCH_QUEUE.name,
  RETRY: QUEUE_CONFIG.RETRY_QUEUE.name,
  BATCH: QUEUE_CONFIG.BATCH_QUEUE.name,
} as const;

/**
 * Job Types
 */
export enum JOB_TYPES {
  DISPATCH_EVENT = 'dispatch-event',
  RETRY_DELIVERY = 'retry-delivery',
  BATCH_PROCESS = 'batch-process',
}

/**
 * Job Priorities
 */
export enum JOB_PRIORITIES {
  LOW = 10,
  NORMAL = 5,
  HIGH = 1,
  CRITICAL = 0,
}

/**
 * Queue Processing Intervals (in milliseconds)
 */
export const QUEUE_PROCESSING_INTERVALS = {
  HEALTH_CHECK: 30000,  // 30 seconds
  METRICS_UPDATE: 60000, // 1 minute
  CLEANUP: 300000,      // 5 minutes
} as const;