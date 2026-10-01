import { IRetryConfig, RetryStrategy } from '@/types/delivery/retry.types';

/**
 * Default retry configurations for different scenarios
 */
export const RETRY_CONFIGS = {
  // Fast retry for critical events
  CRITICAL: {
    maxAttempts: 5,
    strategy: RetryStrategy.EXPONENTIAL,
    initialDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffMultiplier: 2,
    jitter: true
  } as IRetryConfig,

  // Standard retry for normal events
  STANDARD: {
    maxAttempts: 3,
    strategy: RetryStrategy.EXPONENTIAL,
    initialDelay: 2000, // 2 seconds
    maxDelay: 60000, // 1 minute
    backoffMultiplier: 2,
    jitter: true
  } as IRetryConfig,

  // Slow retry for non-critical events
  RELAXED: {
    maxAttempts: 3,
    strategy: RetryStrategy.LINEAR,
    initialDelay: 5000, // 5 seconds
    maxDelay: 300000, // 5 minutes
    backoffMultiplier: 1.5,
    jitter: false
  } as IRetryConfig,

  // Aggressive retry for high-priority events
  AGGRESSIVE: {
    maxAttempts: 7,
    strategy: RetryStrategy.EXPONENTIAL,
    initialDelay: 500, // 0.5 seconds
    maxDelay: 120000, // 2 minutes
    backoffMultiplier: 1.8,
    jitter: true
  } as IRetryConfig
} as const;

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: IRetryConfig = RETRY_CONFIGS.STANDARD;

/**
 * HTTP status codes that should trigger a retry
 */
export const RETRYABLE_STATUS_CODES = [
  408, // Request Timeout
  429, // Too Many Requests
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
  509, // Bandwidth Limit Exceeded
];

/**
 * Error types that should trigger a retry
 */
export const RETRYABLE_ERRORS = [
  'ECONNRESET',
  'ETIMEDOUT',
  'ECONNREFUSED',
  'ENOTFOUND',
  'EAI_AGAIN',
  'TimeoutError',
  'AbortError'
];

/**
 * Maximum time to keep retry records (7 days)
 */
export const MAX_RETRY_RETENTION_DAYS = 7;

/**
 * Retry queue processing batch size
 */
export const RETRY_BATCH_SIZE = 50;

/**
 * Retry processor interval (30 seconds)
 */
export const RETRY_PROCESS_INTERVAL = 30000;