/**
 * Kyrazo SDK Error Classes
 *
 * Comprehensive error hierarchy for handling all API error responses.
 * Each error class corresponds to specific backend error codes.
 *
 * @module errors
 */

/**
 * API error response structure from the backend
 * Matches the backend's `IErrorResponse` interface
 */
export interface APIErrorResponse {
  success: false;
  error: {
    /** Error code identifier (e.g., "RATE_LIMIT_EXCEEDED", "UNAUTHORIZED") */
    code: string;
    /** Human-readable error message */
    message: string;
    /** Additional error details (validation errors, etc.) */
    details?: unknown;
    /** Unique request identifier for debugging */
    requestId?: string;
    /** Seconds to wait before retrying (rate limit errors) */
    retryAfter?: number;
    /** Remaining requests in the current window (rate limit errors) */
    remainingRequests?: number;
  };
}

/**
 * Base error class for all Kyrazo SDK errors
 *
 * @example
 * ```typescript
 * try {
 *   await kyrazo.dispatch.publishEvent(projectId, payload);
 * } catch (error) {
 *   if (error instanceof KyrazoError) {
 *     console.log('Error code:', error.code);
 *     console.log('Request ID:', error.requestId);
 *   }
 * }
 * ```
 */
export class KyrazoError extends Error {
  /**
   * @param message - Human-readable error description
   * @param code - Error code identifier
   * @param statusCode - HTTP status code (if applicable)
   * @param requestId - Unique request ID for debugging
   */
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "KyrazoError";
    Object.setPrototypeOf(this, KyrazoError.prototype);
  }
}

/**
 * Authentication error - invalid or missing API key
 *
 * Backend codes: `UNAUTHORIZED`
 *
 * @example
 * ```typescript
 * catch (error) {
 *   if (error instanceof AuthenticationError) {
 *     console.log('Please check your API key');
 *   }
 * }
 * ```
 */
export class AuthenticationError extends KyrazoError {
  constructor(
    message: string = "Invalid or missing API key",
    requestId?: string,
  ) {
    super(message, "UNAUTHORIZED", 401, requestId);
    this.name = "AuthenticationError";
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Validation error - invalid request payload
 *
 * Backend codes: `INVALID_PAYLOAD`, `BATCH_TOO_LARGE`, `RATE_LIMIT_KEY_MISSING`
 *
 * @example
 * ```typescript
 * catch (error) {
 *   if (error instanceof ValidationError) {
 *     console.log('Invalid input:', error.details);
 *   }
 * }
 * ```
 */
export class ValidationError extends KyrazoError {
  /**
   * @param message - Error description
   * @param details - Validation error details (field-level errors)
   * @param requestId - Request ID for debugging
   */
  constructor(
    message: string,
    public readonly details?: unknown,
    requestId?: string,
  ) {
    super(message, "INVALID_PAYLOAD", 400, requestId);
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Not found error - resource doesn't exist
 *
 * Backend codes: `NOT_FOUND`
 */
export class NotFoundError extends KyrazoError {
  constructor(message: string = "Resource not found", requestId?: string) {
    super(message, "NOT_FOUND", 404, requestId);
    this.name = "NotFoundError";
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Rate limit error - too many requests
 *
 * Backend codes: `RATE_LIMIT_EXCEEDED`
 *
 * @example
 * ```typescript
 * catch (error) {
 *   if (error instanceof RateLimitError) {
 *     console.log(`Rate limited. Retry in ${error.retryAfter} seconds`);
 *     console.log(`Remaining requests: ${error.remainingRequests}`);
 *   }
 * }
 * ```
 */
export class RateLimitError extends KyrazoError {
  /**
   * @param message - Error description
   * @param retryAfter - Seconds to wait before retrying
   * @param remainingRequests - Remaining requests in current window
   * @param requestId - Request ID for debugging
   */
  constructor(
    message: string = "Rate limit exceeded. Please slow down your requests.",
    public readonly retryAfter?: number,
    public readonly remainingRequests?: number,
    requestId?: string,
  ) {
    super(message, "RATE_LIMIT_EXCEEDED", 429, requestId);
    this.name = "RateLimitError";
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Limit exceeded error - monthly event limit exceeded
 *
 * Backend codes: `LIMIT_EXCEEDED`
 *
 * @example
 * ```typescript
 * catch (error) {
 *   if (error instanceof LimitExceededError) {
 *     console.log('Monthly limit exceeded. Please upgrade your plan.');
 *   }
 * }
 * ```
 */
export class LimitExceededError extends KyrazoError {
  constructor(
    message: string = "Monthly event limit exceeded. Please upgrade your plan.",
    requestId?: string,
  ) {
    super(message, "LIMIT_EXCEEDED", 403, requestId);
    this.name = "LimitExceededError";
    Object.setPrototypeOf(this, LimitExceededError.prototype);
  }
}

/**
 * Server error - internal API error
 *
 * Backend codes: `PUBLISH_EVENT_FAILED`, `INTERNAL_ERROR`
 */
export class ServerError extends KyrazoError {
  constructor(message: string = "Internal server error", requestId?: string) {
    super(message, "INTERNAL_ERROR", 500, requestId);
    this.name = "ServerError";
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

/**
 * Network error - connection or timeout issues
 *
 * This error is thrown when the request fails due to network issues,
 * not from an API response.
 */
export class NetworkError extends KyrazoError {
  constructor(message: string = "Network request failed", requestId?: string) {
    super(message, "NETWORK_ERROR", undefined, requestId);
    this.name = "NetworkError";
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Create appropriate error from API response
 *
 * Maps backend error codes to SDK error classes.
 *
 * @param status - HTTP status code
 * @param body - Parsed error response body
 * @param requestId - Request ID from headers (fallback)
 * @param headers - HTTP response headers
 * @returns Appropriate KyrazoError subclass
 *
 * @internal
 */
export function createErrorFromResponse(
  status: number,
  body: APIErrorResponse | null,
  requestId?: string,
  headers?: Headers,
): KyrazoError {
  const errorData = body?.error;
  const message = errorData?.message ?? "An unexpected error occurred";
  const code = errorData?.code ?? "UNKNOWN_ERROR";
  const rid = errorData?.requestId ?? requestId;
  const details = errorData?.details;

  // Helper to get rate limit info from body or headers
  const getRateLimitInfo = () => {
    let retryAfter = errorData?.retryAfter;
    let remaining = errorData?.remainingRequests;

    if (headers) {
      if (retryAfter === undefined) {
        const headerRetry =
          headers.get("Retry-After") || headers.get("retry-after");
        if (headerRetry) retryAfter = parseInt(headerRetry, 10);
      }
      if (remaining === undefined) {
        const headerRemaining =
          headers.get("X-RateLimit-Remaining") ||
          headers.get("x-ratelimit-remaining");
        if (headerRemaining) remaining = parseInt(headerRemaining, 10);
      }
    }
    return { retryAfter, remaining };
  };

  // Map by error code first (more specific)
  switch (code) {
    case "UNAUTHORIZED":
      return new AuthenticationError(message, rid);

    case "RATE_LIMIT_EXCEEDED": {
      const { retryAfter, remaining } = getRateLimitInfo();
      return new RateLimitError(message, retryAfter, remaining, rid);
    }

    case "RATE_LIMIT_KEY_MISSING":
    case "INVALID_PAYLOAD":
    case "BATCH_TOO_LARGE":
      return new ValidationError(message, details, rid);

    case "LIMIT_EXCEEDED":
      return new LimitExceededError(message, rid);

    case "NOT_FOUND":
      return new NotFoundError(message, rid);

    case "PUBLISH_EVENT_FAILED":
    case "INTERNAL_ERROR":
      return new ServerError(message, rid);
  }

  // Fallback to status code mapping
  switch (status) {
    case 400:
      return new ValidationError(message, details, rid);
    case 401:
      return new AuthenticationError(message, rid);
    case 403:
      return new LimitExceededError(message, rid);
    case 404:
      return new NotFoundError(message, rid);
    case 429: {
      const { retryAfter, remaining } = getRateLimitInfo();
      return new RateLimitError(message, retryAfter, remaining, rid);
    }
    case 500:
    case 502:
    case 503:
    case 504:
      return new ServerError(message, rid);
    default:
      return new KyrazoError(message, code, status, rid);
  }
}
