/**
 * Kyrazo SDK Error Classes
 *
 * Comprehensive error hierarchy for handling all API error responses.
 * Each error class corresponds to specific backend error codes.
 *
 * @module errors
 */

/**
 * Individual validation error detail
 */
export interface ValidationErrorDetail {
  /** The field that failed validation (e.g., "name", "config.timeout") */
  field: string;
  /** Human-readable validation error message */
  message: string;
}

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
    details?: ValidationErrorDetail[];
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
 *   await kyrazo.dispatch.publishEvent(namespaceId, payload);
 * } catch (error: any) {
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
 * catch (error: any) {
 *   if (error instanceof AuthenticationError) {
 *     console.log('Please check your API key');
 *   }
 * }
 * ```
 */
export class AuthenticationError extends KyrazoError {
  constructor(
    message: string = "Invalid or missing API key",
    code: string = "UNAUTHORIZED",
    requestId?: string,
  ) {
    super(message, code, 401, requestId);
    this.name = "AuthenticationError";
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Forbidden error - insufficient permissions
 *
 * Backend codes: `ACCESS_DENIED`, `INSUFFICIENT_PERMISSIONS`, `WORKSPACE_ACCESS_DENIED`, etc.
 */
export class ForbiddenError extends KyrazoError {
  constructor(
    message: string = "Insufficient permissions",
    code: string = "ACCESS_DENIED",
    requestId?: string,
  ) {
    super(message, code, 403, requestId);
    this.name = "ForbiddenError";
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * Validation error - invalid request payload
 *
 * Backend codes: `INVALID_PAYLOAD`, `BATCH_TOO_LARGE`, `RATE_LIMIT_KEY_MISSING`
 *
 * @example
 * ```typescript
 * catch (error: any) {
 *   if (error instanceof ValidationError) {
 *     console.log('Invalid input:', error.details);
 *   }
 * }
 * ```
 */
export class ValidationError extends KyrazoError {
  /**
   * @param message - Error description
   * @param code - Error code identifier
   * @param details - Validation error details
   * @param requestId - Request ID for debugging
   */
  constructor(
    message: string,
    code: string = "INVALID_PAYLOAD",
    public readonly details?: ValidationErrorDetail[],
    requestId?: string,
  ) {
    super(message, code, 400, requestId);
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
  constructor(
    message: string = "Resource not found",
    code: string = "NOT_FOUND",
    requestId?: string,
  ) {
    super(message, code, 404, requestId);
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
 * catch (error: any) {
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
 * catch (error: any) {
 *   if (error instanceof LimitExceededError) {
 *     console.log('Monthly limit exceeded. Please upgrade your plan.');
 *   }
 * }
 * ```
 */
export class LimitExceededError extends KyrazoError {
  constructor(
    message: string = "Monthly event limit exceeded. Please upgrade your plan.",
    public readonly retryAfter?: number,
    public readonly remainingRequests?: number,
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
  constructor(
    message: string = "Internal server error",
    code: string = "INTERNAL_ERROR",
    requestId?: string,
  ) {
    super(message, code, 500, requestId);
    this.name = "ServerError";
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

/**
 * Conflict error - resource state conflict (e.g., idempotency)
 *
 * Backend codes: `IDEMPOTENCY_CONFLICT`
 */
export class ConflictError extends KyrazoError {
  constructor(
    message: string = "Resource conflict",
    code: string = "CONFLICT",
    requestId?: string,
  ) {
    super(message, code, 409, requestId);
    this.name = "ConflictError";
    Object.setPrototypeOf(this, ConflictError.prototype);
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
    // 401 Unauthorized
    case "UNAUTHORIZED":
    case "UNAUTHORIZED_USER":
    case "UNAUTHORIZED_WORKSPACE":
    case "AUTH_ERROR":
    case "INVALID_TOKEN":
    case "INVALID_API_KEY":
    case "MISSING_TOKEN":
    case "API_KEY_MISSING":
    case "UNAUTORIZED_USER": // Backend typo fallback
      return new AuthenticationError(message, code, rid);

    // 403 Forbidden
    case "ACCESS_DENIED":
    case "INSUFFICIENT_PERMISSIONS":
    case "INSUFFICIENT_KEY_ROLE":
    case "INSUFFICIENT_WORKSPACE_ROLE":
    case "WORKSPACE_ACCESS_DENIED":
    case "NAMESPACE_ACCESS_DENIED":
    case "IP_NOT_WHITELISTED":
    case "OTP_REQUIRED":
    case "OWNERSHIP_REQUIRED":
      return new ForbiddenError(message, code, rid);

    // 403/429 Limits
    case "LIMIT_EXCEEDED":
    case "PLAN_LIMIT_EXCEEDED": {
      const { retryAfter, remaining } = getRateLimitInfo();
      return new LimitExceededError(message, retryAfter, remaining, rid);
    }

    case "RATE_LIMIT_EXCEEDED": {
      const { retryAfter, remaining } = getRateLimitInfo();
      return new RateLimitError(message, retryAfter, remaining, rid);
    }

    // 400 Validation
    case "RATE_LIMIT_KEY_MISSING":
    case "INVALID_PAYLOAD":
    case "BATCH_TOO_LARGE":
    case "IDS_MISSING":
    case "PROJECT_ID_MISSING":
    case "RESOURCE_ID_MISSING":
    case "WORKSPACE_ID_MISSING":
    case "IDEMPOTENCY_KEY_REQUIRED":
    case "BAD_REQUEST":
    case "INVALID_CODE":
    case "INVALID_STATUS":
    case "INVALID_NAMESPACE":
    case "INVALID_TEMP_TOKEN":
    case "INVALID_CURRENT_PASSWORD":
    case "GOOGLE_NO_EMAIL":
    case "USER_EXISTS":
    case "ENDPOINT_ALREADY_EXISTS":
    case "TARGET_ALREADY_EXISTS":
    case "FEATURE_NOT_AVAILABLE":
    case "NO_VALID_TARGETS":
      return new ValidationError(message, code, details, rid);

    // 404 Not Found
    case "NOT_FOUND":
    case "NAMESPACE_NOT_FOUND":
    case "SUBSCRIPTION_NOT_FOUND":
    case "USER_NOT_FOUND":
    case "WORKSPACE_NOT_FOUND":
    case "WEBHOOK_NOT_FOUND":
    case "PLAN_NOT_FOUND":
    case "SESSION_NOT_FOUND":
      return new NotFoundError(message, code, rid);

    // 409 Conflict
    case "IDEMPOTENCY_CONFLICT":
      return new ConflictError(message, code, rid);

    // 500 Internal Server Error
    case "INTERNAL_ERROR":
    case "PUBLISH_EVENT_FAILED":
    case "RECEIVED_EVENT_FAILED":
    case "CREATE_NAMESPACE_FAILED":
    case "UPDATE_NAMESPACE_FAILED":
    case "DELETE_NAMESPACE_FAILED":
    case "RESTORE_NAMESPACE_FAILED":
    case "GET_NAMESPACE_FAILED":
    case "GET_NAMESPACES_FAILED":
    case "CREATE_TARGET_FAILED":
    case "UPDATE_TARGET_FAILED":
    case "DELETE_TARGET_FAILED":
    case "GET_TARGET_FAILED":
    case "GET_TARGETS_FAILED":
    case "GET_TARGET_DELIVERIES_FAILED":
    case "CREATE_ENDPOINT_FAILED":
    case "UPDATE_ENDPOINT_FAILED":
    case "DELETE_ENDPOINT_FAILED":
    case "GET_ENDPOINT_FAILED":
    case "GET_ENDPOINTS_FAILED":
    case "CREATE_API_KEY_FAILED":
    case "DELETE_KEY_FAILED":
    case "GET_KEYS_FAILED":
    case "CREATE_WEBHOOK_FAILED":
    case "UPDATE_WEBHOOK_FAILED":
    case "DELETE_WEBHOOK_FAILED":
    case "GET_WEBHOOKS_FAILED":
    case "CREATE_SUBSCRIPTION_FAILED":
    case "UPDATE_STATUS_FAILED":
    case "GET_SUBSCRIPTION_FAILED":
    case "GET_SUBSCRIPTIONS_FAILED":
    case "CREATE_PLAN_FAILED":
    case "UPDATE_PLAN_FAILED":
    case "DELETE_PLAN_FAILED":
    case "GET_PLAN_FAILED":
    case "GET_PLANS_FAILED":
    case "GET_INVOICES_FAILED":
    case "CREATE_PORTAL_FAILED":
    case "REGENERATE_PRICE_FAILED":
    case "FIX_PLANS_FAILED":
    case "UPDATE_WORKSPACE_FAILED":
    case "DELETE_WORKSPACE_FAILED":
    case "ARCHIVE_WORKSPACE_FAILED":
    case "RESTORE_WORKSPACE_FAILED":
    case "GET_WORKSPACE_FAILED":
    case "GET_USER_WORKSPACES_FAILED":
    case "INVITE_USER_FAILED":
    case "REMOVE_USER_FAILED":
    case "UPDATE_USER_ROLE_FAILED":
    case "ACCEPT_INVITATION_FAILED":
    case "REJECT_INVITATION_FAILED":
    case "GET_INVITATION_DETAILS_FAILED":
    case "LEAVE_WORKSPACE_FAILED":
    case "GET_WORKSPACE_MEMBER_FAILED":
    case "UPDATE_PROFILE_FAILED":
    case "PROFILE_FETCH_FAILED":
    case "PROFILE_UPDATE_FAILED":
    case "PREFERENCES_FETCH_FAILED":
    case "PREFERENCES_UPDATE_FAILED":
    case "CHANGE_PASSWORD_FAILED":
    case "RESET_PASSWORD_FAILED":
    case "SEND_RESET_PASSWORD_FAILED":
    case "SEND_VERIFICATION_FAILED":
    case "VERIFY_EMAIL_FAILED":
    case "VERIFY_OTP_FAILED":
    case "REQUEST_OTP_FAILED":
    case "RESEND_OTP_FAILED":
    case "RESEND_VERIFICATION_FAILED":
    case "LOGIN_FAILED":
    case "LOGOUT_FAILED":
    case "REGISTRATION_FAILED":
    case "VERIFY_SESSION_FAILED":
    case "TOKEN_REFRESH_FAILED":
    case "GET_DELIVERIES_FAILED":
    case "GET_DELIVERY_FAILED":
    case "GET_DELIVERY_STATS_FAILED":
    case "GET_INGEST_STATS_FAILED":
    case "SUPPORT_TICKET_FAILED":
      return new ServerError(message, code, rid);
  }

  // Fallback to status code mapping
  switch (status) {
    case 400:
      return new ValidationError(message, code as string, details, rid);
    case 401:
      return new AuthenticationError(message, code as string, rid);
    case 403:
      // Distinguish between Forbidden and Limit Exceeded if possible
      if (code === "LIMIT_EXCEEDED" || code === "PLAN_LIMIT_EXCEEDED") {
        const { retryAfter, remaining } = getRateLimitInfo();
        return new LimitExceededError(message, retryAfter, remaining, rid);
      }
      return new ForbiddenError(message, code as string, rid);
    case 404:
      return new NotFoundError(message, code as string, rid);
    case 409:
      return new ConflictError(message, code, rid);
    case 429: {
      const { retryAfter, remaining } = getRateLimitInfo();
      return new RateLimitError(message, retryAfter, remaining, rid);
    }
    case 500:
    case 502:
    case 503:
    case 504:
      return new ServerError(message, code as string, rid);
    default:
      return new KyrazoError(message, code, status, rid);
  }
}
