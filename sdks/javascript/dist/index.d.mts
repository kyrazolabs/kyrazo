/**
 * SDK Configuration options
 */
interface KyrazoConfig {
    /**
     * Your Kyrazo API key
     */
    apiKey: string;
    /**
     * Base URL for the API (defaults to production)
     */
    baseURL?: string;
    /**
     * Request timeout in milliseconds (default: 30000)
     */
    timeout?: number;
    /**
     * Number of retry attempts for failed requests (default: 3)
     */
    maxRetries?: number;
    /**
     * Custom headers to include in all requests
     */
    headers?: Record<string, string>;
}
/**
 * Default configuration values
 */
declare const DEFAULT_CONFIG: {
    readonly baseURL: "https://api.kyrazo.com";
    readonly timeout: 30000;
    readonly maxRetries: 3;
};

/**
 * HTTP utilities
 */

/**
 * HTTP method types
 */
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
/**
 * HTTP request configuration
 */
interface HttpRequestConfig {
    method: HttpMethod;
    path: string;
    body?: unknown;
    params?: any;
    headers?: Record<string, string>;
    timeout?: number;
    signal?: AbortSignal;
}
/**
 * HTTP response wrapper
 */
interface HttpResponse<T> {
    data: T;
    status: number;
    headers: Headers;
}
/**
 * HTTP Client for making API requests
 */
declare class HttpClient {
    private readonly baseURL;
    private readonly apiKey;
    private readonly defaultTimeout;
    private readonly maxRetries;
    private readonly customHeaders;
    constructor(config: Required<Omit<KyrazoConfig, "headers">> & Pick<KyrazoConfig, "headers">);
    /**
     * Build full URL with query parameters
     */
    private buildUrl;
    /**
     * Build request headers
     */
    private buildHeaders;
    /**
     * Execute HTTP request with retry logic
     */
    request<T>(config: HttpRequestConfig): Promise<HttpResponse<T>>;
    /**
     * Merge multiple abort signals
     */
    private mergeAbortSignals;
    /**
     * Delay helper for retry backoff
     */
    private delay;
    /**
     * Convenience methods
     */
    get<T>(path: string, params?: any, options?: {
        headers?: Record<string, string>;
        timeout?: number;
        signal?: AbortSignal;
    }): Promise<HttpResponse<T>>;
    post<T>(path: string, body?: unknown, options?: {
        headers?: Record<string, string>;
        timeout?: number;
        signal?: AbortSignal;
    }): Promise<HttpResponse<T>>;
    put<T>(path: string, body?: unknown, options?: {
        headers?: Record<string, string>;
        timeout?: number;
        signal?: AbortSignal;
    }): Promise<HttpResponse<T>>;
    patch<T>(path: string, body?: unknown, options?: {
        headers?: Record<string, string>;
        timeout?: number;
        signal?: AbortSignal;
    }): Promise<HttpResponse<T>>;
    delete<T>(path: string, options?: {
        headers?: Record<string, string>;
        timeout?: number;
        signal?: AbortSignal;
    }): Promise<HttpResponse<T>>;
}

/**
 * Common Type Definitions
 */
interface PaginationParams {
    limit?: number;
    page?: number;
}
interface PaginatedResponse<T> {
    success: boolean;
    message: string;
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
    data: T[];
}
interface APIResponse<T> {
    success: boolean;
    message: string;
    data: T;
}
interface Timestamps {
    createdAt: string;
    updatedAt: string;
}
interface EventTarget {
    targetUrl: string;
    targetId?: string;
    headers?: Record<string, string>;
}
type EventData = Record<string, unknown>;
interface RequestOptions {
    headers?: Record<string, string>;
    timeout?: number;
    signal?: AbortSignal;
}
interface ResponseMeta {
    requestId?: string;
    [key: string]: unknown;
}

/**
 * Dispatch Module Types
 *
 * Type definitions for event publishing and dispatch operations.
 * All types are aligned with the backend API response shapes.
 *
 * @module types/dispatch
 */

/**
 * Priority levels for event processing
 */
type EventPriority = "low" | "normal" | "high" | "urgent";
/**
 * Possible event status values
 */
type EventStatus = "pending" | "processing" | "delivered" | "failed" | "retrying" | "timeout" | "network_error";
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
interface PublishEventPayload {
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
interface PublishEventResponse {
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
interface BatchPublishEventResponseItem {
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
type BatchPublishEventResponse = BatchPublishEventResponseItem[];

/**
 * Events Module Types
 */

/**
 * Options for publishing events
 */
interface PublishEventOptions {
    /**
     * Idempotency key for preventing duplicate events
     */
    idempotencyKey?: string;
}

/**
 * Publish Event Function
 *
 * Publishes a single event to the specified project for webhook delivery.
 *
 * @module modules/dispatch/publish-event
 */

/**
 * Create the publishEvent function bound to an HTTP client
 * @internal
 */
declare function createPublishEvent(httpClient: HttpClient): (projectId: string, payload: PublishEventPayload, options?: PublishEventOptions) => Promise<PublishEventResponse>;

/**
 * Batch Publish Events Function
 *
 * Publishes multiple events in a single request for efficient bulk operations.
 *
 * @module modules/dispatch/publish-events
 */

/**
 * Create the publishEvents function bound to an HTTP client
 * @internal
 */
declare function createPublishEvents(httpClient: HttpClient): (projectId: string, events: PublishEventPayload[], options?: PublishEventOptions) => Promise<BatchPublishEventResponse>;

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

/**
 * Events module interface
 *
 * Provides methods for publishing events to webhook targets.
 */
interface EventsModule {
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
 * Sources Type Definitions
 */

type SourceStatus = "active" | "inactive";
type SourceService = "stripe" | "paypal";
type SourceAuthType = "service" | "api_key" | "basic_auth";
interface SourceRetryPolicy {
    maxAttempts: number;
}
interface SourceAuthentication {
    enabled: boolean;
    type?: SourceAuthType;
    service?: {
        secret: string;
    };
    basicAuth?: {
        username: string;
        password: string;
    };
    apiKey?: {
        headerKey: string;
        apiKey: string;
    };
}
interface Source {
    _id: string;
    name: string;
    description?: string;
    type: "receive" | "publish" | "forward";
    service: SourceService;
    status: SourceStatus;
    forwarding: boolean;
    endpoints?: string[];
    eventTypes: string[];
    retryPolicy?: SourceRetryPolicy;
    authentication?: SourceAuthentication;
    createdAt: string;
    updatedAt: string;
}
interface CreateSourceInput {
    name: string;
    description?: string;
    type?: "receive";
    service: SourceService;
    status?: SourceStatus;
    forwarding?: boolean;
    endpoints?: string[];
    eventTypes?: string[];
    retryPolicy?: SourceRetryPolicy;
    authentication?: SourceAuthentication;
}
interface UpdateSourceInput extends Partial<Omit<CreateSourceInput, "service" | "authentication">> {
}
interface FilterSourcesInput extends PaginationParams {
    q?: string;
    status?: SourceStatus;
    tags?: string;
}

/**
 * Sources Module
 */

/**
 * Sources Module Interface
 */
interface SourcesModule {
    list: (projectId: string, params?: FilterSourcesInput) => Promise<PaginatedResponse<Source>>;
    get: (projectId: string, sourceId: string) => Promise<APIResponse<Source>>;
    create: (projectId: string, data: CreateSourceInput) => Promise<APIResponse<Source>>;
    update: (projectId: string, sourceId: string, data: UpdateSourceInput) => Promise<APIResponse<Source>>;
    delete: (projectId: string, sourceId: string) => Promise<APIResponse<void>>;
}

/**
 * Endpoints Type Definitions
 */

type EndpointStatus = "active" | "inactive";
interface EndpointConfig {
    timeout: number;
    retryCount: number;
    rateLimit?: number;
    rateLimitDuration: number;
}
interface Endpoint {
    _id: string;
    name: string;
    status: EndpointStatus;
    url: string;
    description?: string;
    enabled: boolean;
    config: EndpointConfig;
    customHeaders?: Record<string, string>;
    createdAt: string;
    updatedAt: string;
}
interface CreateEndpointInput {
    name: string;
    status: EndpointStatus;
    url: string;
    description?: string;
    enabled?: boolean;
    config: EndpointConfig;
    customHeaders?: Record<string, string>;
}
interface UpdateEndpointInput extends Partial<CreateEndpointInput> {
}
interface FilterEndpointsInput extends PaginationParams {
    q?: string;
    status?: EndpointStatus;
}

/**
 * Endpoints Module
 */

/**
 * Endpoints Module Interface
 */
interface EndpointsModule {
    list: (projectId: string, params?: FilterEndpointsInput) => Promise<PaginatedResponse<Endpoint>>;
    get: (projectId: string, endpointId: string) => Promise<APIResponse<Endpoint>>;
    create: (projectId: string, data: CreateEndpointInput) => Promise<APIResponse<Endpoint>>;
    update: (projectId: string, endpointId: string, data: UpdateEndpointInput) => Promise<APIResponse<Endpoint>>;
    delete: (projectId: string, endpointId: string) => Promise<APIResponse<void>>;
}

/**
 * Targets Type Definitions
 */

type TargetMethod = "POST" | "PUT" | "PATCH" | "GET" | "DELETE";
interface TargetConfig {
    timeout: number;
    retryCount: number;
    rateLimit?: number;
    rateLimitDuration: number;
}
interface Target {
    _id: string;
    name: string;
    url: string;
    method: TargetMethod;
    description?: string;
    enabled: boolean;
    config: TargetConfig;
    customHeaders?: Record<string, string>;
    createdAt: string;
    updatedAt: string;
}
interface CreateTargetInput {
    name: string;
    url: string;
    method?: TargetMethod;
    description?: string;
    enabled?: boolean;
    config: TargetConfig;
    customHeaders?: Record<string, string>;
}
interface UpdateTargetInput extends Partial<CreateTargetInput> {
}
interface FilterTargetsInput extends PaginationParams {
    q?: string;
    enabled?: boolean;
}

/**
 * Targets Module
 */

/**
 * Targets Module Interface
 */
interface TargetsModule {
    list: (projectId: string, params?: FilterTargetsInput) => Promise<PaginatedResponse<Target>>;
    get: (projectId: string, targetId: string) => Promise<APIResponse<Target>>;
    create: (projectId: string, data: CreateTargetInput) => Promise<APIResponse<Target>>;
    update: (projectId: string, targetId: string, data: UpdateTargetInput) => Promise<APIResponse<Target>>;
    delete: (projectId: string, targetId: string) => Promise<APIResponse<void>>;
}

/**
 * Kyrazo SDK Client
 */

/**
 * Kyrazo SDK Client
 *
 * @example
 * ```ts
 * const kyrazo = new Kyrazo({
 *   apiKey: "your-api-key",
 *   baseURL: "http://localhost:4000"
 * });
 *
 * const response = await kyrazo.events.single("project-123", {
 *   eventType: "user.created",
 *   webhookId: "webhook-456",
 *   workspaceId: "workspace-789",
 *   payload: { userId: "u_123" },
 *   targets: [{ targetUrl: "https://example.com/webhook" }]
 * });
 * ```
 */
declare class Kyrazo {
    /**
     * Events module for publishing events
     */
    readonly events: EventsModule;
    /**
     * Sources module for managing event sources
     */
    readonly sources: SourcesModule;
    /**
     * Endpoints module for managing endpoints
     */
    readonly endpoints: EndpointsModule;
    /**
     * Targets module for managing webhook targets
     */
    readonly targets: TargetsModule;
    /**
     * The HTTP client used for requests
     */
    private readonly httpClient;
    /**
     * Resolved configuration
     */
    private readonly config;
    /**
     * Create a new Kyrazo SDK instance
     *
     * @param config - SDK configuration options
     */
    constructor(config: KyrazoConfig);
    /**
     * Get the current SDK configuration
     */
    getConfig(): Readonly<typeof this.config>;
}

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
interface APIErrorResponse {
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
declare class KyrazoError extends Error {
    readonly code: string;
    readonly statusCode?: number | undefined;
    readonly requestId?: string | undefined;
    /**
     * @param message - Human-readable error description
     * @param code - Error code identifier
     * @param statusCode - HTTP status code (if applicable)
     * @param requestId - Unique request ID for debugging
     */
    constructor(message: string, code: string, statusCode?: number | undefined, requestId?: string | undefined);
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
declare class AuthenticationError extends KyrazoError {
    constructor(message?: string, requestId?: string);
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
declare class ValidationError extends KyrazoError {
    readonly details?: unknown | undefined;
    /**
     * @param message - Error description
     * @param details - Validation error details (field-level errors)
     * @param requestId - Request ID for debugging
     */
    constructor(message: string, details?: unknown | undefined, requestId?: string);
}
/**
 * Not found error - resource doesn't exist
 *
 * Backend codes: `NOT_FOUND`
 */
declare class NotFoundError extends KyrazoError {
    constructor(message?: string, requestId?: string);
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
declare class RateLimitError extends KyrazoError {
    readonly retryAfter?: number | undefined;
    readonly remainingRequests?: number | undefined;
    /**
     * @param message - Error description
     * @param retryAfter - Seconds to wait before retrying
     * @param remainingRequests - Remaining requests in current window
     * @param requestId - Request ID for debugging
     */
    constructor(message?: string, retryAfter?: number | undefined, remainingRequests?: number | undefined, requestId?: string);
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
declare class LimitExceededError extends KyrazoError {
    constructor(message?: string, requestId?: string);
}
/**
 * Server error - internal API error
 *
 * Backend codes: `PUBLISH_EVENT_FAILED`, `INTERNAL_ERROR`
 */
declare class ServerError extends KyrazoError {
    constructor(message?: string, requestId?: string);
}
/**
 * Network error - connection or timeout issues
 *
 * This error is thrown when the request fails due to network issues,
 * not from an API response.
 */
declare class NetworkError extends KyrazoError {
    constructor(message?: string, requestId?: string);
}

declare const VERSION = "1.0.0";

export { type APIErrorResponse, type APIResponse, AuthenticationError, type BatchPublishEventResponse, type BatchPublishEventResponseItem, type CreateEndpointInput, type CreateSourceInput, type CreateTargetInput, DEFAULT_CONFIG, type Endpoint, type EndpointConfig, type EndpointStatus, type EndpointsModule, type EventData, type EventPriority, type EventStatus, type EventTarget, type EventsModule, type FilterEndpointsInput, type FilterSourcesInput, type FilterTargetsInput, Kyrazo, type KyrazoConfig, KyrazoError, LimitExceededError, NetworkError, NotFoundError, type PaginatedResponse, type PaginationParams, type PublishEventPayload, type PublishEventResponse, RateLimitError, type RequestOptions, type ResponseMeta, ServerError, type Source, type SourceAuthType, type SourceService, type SourceStatus, type SourcesModule, type Target, type TargetConfig, type TargetMethod, type TargetsModule, type Timestamps, type UpdateEndpointInput, type UpdateSourceInput, type UpdateTargetInput, VERSION, ValidationError };
