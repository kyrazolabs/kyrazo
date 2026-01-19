"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  AuthenticationError: () => AuthenticationError,
  DEFAULT_CONFIG: () => DEFAULT_CONFIG,
  Kyrazo: () => Kyrazo,
  KyrazoError: () => KyrazoError,
  LimitExceededError: () => LimitExceededError,
  NetworkError: () => NetworkError,
  NotFoundError: () => NotFoundError,
  RateLimitError: () => RateLimitError,
  ServerError: () => ServerError,
  VERSION: () => VERSION,
  ValidationError: () => ValidationError
});
module.exports = __toCommonJS(index_exports);

// src/config.ts
var DEFAULT_CONFIG = {
  baseURL: "https://api.kyrazo.com",
  timeout: 3e4,
  maxRetries: 3
};
function resolveConfig(config) {
  return {
    apiKey: config.apiKey,
    baseURL: config.baseURL ?? DEFAULT_CONFIG.baseURL,
    timeout: config.timeout ?? DEFAULT_CONFIG.timeout,
    maxRetries: config.maxRetries ?? DEFAULT_CONFIG.maxRetries,
    headers: config.headers
  };
}

// src/errors.ts
var KyrazoError = class _KyrazoError extends Error {
  /**
   * @param message - Human-readable error description
   * @param code - Error code identifier
   * @param statusCode - HTTP status code (if applicable)
   * @param requestId - Unique request ID for debugging
   */
  constructor(message, code, statusCode, requestId) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.requestId = requestId;
    this.name = "KyrazoError";
    Object.setPrototypeOf(this, _KyrazoError.prototype);
  }
};
var AuthenticationError = class _AuthenticationError extends KyrazoError {
  constructor(message = "Invalid or missing API key", requestId) {
    super(message, "UNAUTHORIZED", 401, requestId);
    this.name = "AuthenticationError";
    Object.setPrototypeOf(this, _AuthenticationError.prototype);
  }
};
var ValidationError = class _ValidationError extends KyrazoError {
  /**
   * @param message - Error description
   * @param details - Validation error details (field-level errors)
   * @param requestId - Request ID for debugging
   */
  constructor(message, details, requestId) {
    super(message, "INVALID_PAYLOAD", 400, requestId);
    this.details = details;
    this.name = "ValidationError";
    Object.setPrototypeOf(this, _ValidationError.prototype);
  }
};
var NotFoundError = class _NotFoundError extends KyrazoError {
  constructor(message = "Resource not found", requestId) {
    super(message, "NOT_FOUND", 404, requestId);
    this.name = "NotFoundError";
    Object.setPrototypeOf(this, _NotFoundError.prototype);
  }
};
var RateLimitError = class _RateLimitError extends KyrazoError {
  /**
   * @param message - Error description
   * @param retryAfter - Seconds to wait before retrying
   * @param remainingRequests - Remaining requests in current window
   * @param requestId - Request ID for debugging
   */
  constructor(message = "Rate limit exceeded. Please slow down your requests.", retryAfter, remainingRequests, requestId) {
    super(message, "RATE_LIMIT_EXCEEDED", 429, requestId);
    this.retryAfter = retryAfter;
    this.remainingRequests = remainingRequests;
    this.name = "RateLimitError";
    Object.setPrototypeOf(this, _RateLimitError.prototype);
  }
};
var LimitExceededError = class _LimitExceededError extends KyrazoError {
  constructor(message = "Monthly event limit exceeded. Please upgrade your plan.", requestId) {
    super(message, "LIMIT_EXCEEDED", 403, requestId);
    this.name = "LimitExceededError";
    Object.setPrototypeOf(this, _LimitExceededError.prototype);
  }
};
var ServerError = class _ServerError extends KyrazoError {
  constructor(message = "Internal server error", requestId) {
    super(message, "INTERNAL_ERROR", 500, requestId);
    this.name = "ServerError";
    Object.setPrototypeOf(this, _ServerError.prototype);
  }
};
var NetworkError = class _NetworkError extends KyrazoError {
  constructor(message = "Network request failed", requestId) {
    super(message, "NETWORK_ERROR", void 0, requestId);
    this.name = "NetworkError";
    Object.setPrototypeOf(this, _NetworkError.prototype);
  }
};
function createErrorFromResponse(status, body, requestId, headers) {
  const errorData = body?.error;
  const message = errorData?.message ?? "An unexpected error occurred";
  const code = errorData?.code ?? "UNKNOWN_ERROR";
  const rid = errorData?.requestId ?? requestId;
  const details = errorData?.details;
  const getRateLimitInfo = () => {
    let retryAfter = errorData?.retryAfter;
    let remaining = errorData?.remainingRequests;
    if (headers) {
      if (retryAfter === void 0) {
        const headerRetry = headers.get("Retry-After") || headers.get("retry-after");
        if (headerRetry) retryAfter = parseInt(headerRetry, 10);
      }
      if (remaining === void 0) {
        const headerRemaining = headers.get("X-RateLimit-Remaining") || headers.get("x-ratelimit-remaining");
        if (headerRemaining) remaining = parseInt(headerRemaining, 10);
      }
    }
    return { retryAfter, remaining };
  };
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

// src/version.ts
var VERSION = "1.0.0";

// src/utils/http.ts
var HttpClient = class {
  baseURL;
  apiKey;
  defaultTimeout;
  maxRetries;
  customHeaders;
  constructor(config) {
    this.baseURL = config.baseURL.replace(/\/$/, "");
    this.apiKey = config.apiKey;
    this.defaultTimeout = config.timeout;
    this.maxRetries = config.maxRetries;
    this.customHeaders = config.headers ?? {};
  }
  /**
   * Build full URL with query parameters
   */
  buildUrl(path, params) {
    const url = new URL(path, this.baseURL);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== void 0 && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }
  /**
   * Build request headers
   */
  buildHeaders(additionalHeaders) {
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-api-key": this.apiKey,
      "User-Agent": `kyrazo-sdk/${VERSION}`,
      ...this.customHeaders,
      ...additionalHeaders
    };
  }
  /**
   * Execute HTTP request with retry logic
   */
  async request(config) {
    const url = this.buildUrl(config.path, config.params);
    const headers = this.buildHeaders(config.headers);
    const timeout = config.timeout ?? this.defaultTimeout;
    let lastError = null;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        const signal = config.signal ? this.mergeAbortSignals(config.signal, controller.signal) : controller.signal;
        const response = await fetch(url, {
          method: config.method,
          headers,
          body: config.body ? JSON.stringify(config.body) : void 0,
          signal
        });
        clearTimeout(timeoutId);
        const contentType = response.headers.get("content-type");
        let data;
        if (contentType?.includes("application/json")) {
          data = await response.json();
        } else {
          data = await response.text();
        }
        if (!response.ok) {
          const errorBody = data;
          const requestId = response.headers.get("x-request-id") ?? void 0;
          throw createErrorFromResponse(
            response.status,
            errorBody,
            requestId,
            response.headers
          );
        }
        return {
          data,
          status: response.status,
          headers: response.headers
        };
      } catch (error) {
        lastError = error;
        if (error instanceof Error && (error.name === "AbortError" || error.statusCode !== void 0 && error.statusCode < 500)) {
          throw error;
        }
        if (attempt < this.maxRetries) {
          await this.delay(Math.pow(2, attempt) * 100);
        }
      }
    }
    if (lastError?.name === "AbortError") {
      throw new NetworkError("Request timed out");
    }
    throw lastError ?? new NetworkError("Request failed after retries");
  }
  /**
   * Merge multiple abort signals
   */
  mergeAbortSignals(...signals) {
    const controller = new AbortController();
    for (const signal of signals) {
      if (signal.aborted) {
        controller.abort(signal.reason);
        break;
      }
      signal.addEventListener("abort", () => controller.abort(signal.reason), {
        once: true
      });
    }
    return controller.signal;
  }
  /**
   * Delay helper for retry backoff
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  /**
   * Convenience methods
   */
  async get(path, params, options) {
    return this.request({ method: "GET", path, params, ...options });
  }
  async post(path, body, options) {
    return this.request({ method: "POST", path, body, ...options });
  }
  async put(path, body, options) {
    return this.request({ method: "PUT", path, body, ...options });
  }
  async patch(path, body, options) {
    return this.request({ method: "PATCH", path, body, ...options });
  }
  async delete(path, options) {
    return this.request({ method: "DELETE", path, ...options });
  }
};

// src/modules/events/publish-event.ts
function createPublishEvent(httpClient) {
  return async function publishEvent(projectId, payload, options) {
    if (!projectId || typeof projectId !== "string" || projectId.trim() === "") {
      throw new ValidationError(
        "projectId is required and must be a non-empty string"
      );
    }
    if (!payload || typeof payload !== "object") {
      throw new ValidationError("payload is required and must be an object");
    }
    const { webhookId, eventType, payload: eventData, targets } = payload;
    if (!webhookId || typeof webhookId !== "string") {
      throw new ValidationError("webhookId is required and must be a string");
    }
    if (!eventType || typeof eventType !== "string") {
      throw new ValidationError("eventType is required and must be a string");
    }
    if (eventData === void 0 || eventData === null) {
      throw new ValidationError("payload is required");
    }
    if (!Array.isArray(targets) || targets.length === 0) {
      throw new ValidationError(
        "targets is required and must be a non-empty array"
      );
    }
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      if (!target || typeof target !== "object") {
        throw new ValidationError(`targets[${i}] must be an object`);
      }
      if (!target.targetUrl || typeof target.targetUrl !== "string") {
        throw new ValidationError(
          `targets[${i}].targetUrl is required and must be a string`
        );
      }
      try {
        new URL(target.targetUrl);
      } catch {
        throw new ValidationError(
          `targets[${i}].targetUrl must be a valid URL`
        );
      }
    }
    if (payload.meta !== void 0) {
      if (typeof payload.meta !== "object") {
        throw new ValidationError("meta must be an object");
      }
      if (payload.meta.priority !== void 0) {
        const validPriorities = ["low", "normal", "high", "urgent"];
        if (!validPriorities.includes(payload.meta.priority)) {
          throw new ValidationError(
            `meta.priority must be one of: ${validPriorities.join(", ")}`
          );
        }
      }
      if (payload.meta.maxRetries !== void 0) {
        if (typeof payload.meta.maxRetries !== "number" || payload.meta.maxRetries < 0 || payload.meta.maxRetries > 10) {
          throw new ValidationError(
            "meta.maxRetries must be a number between 0 and 10"
          );
        }
      }
    }
    const requestOptions = options?.idempotencyKey ? { headers: { "Idempotency-Key": options.idempotencyKey } } : void 0;
    const response = await httpClient.post(
      `/v1/events/${projectId}/publish`,
      payload,
      requestOptions
    );
    return response.data;
  };
}

// src/modules/events/publish-events.ts
var MAX_BATCH_SIZE = 100;
function createPublishEvents(httpClient) {
  return async function publishEvents(projectId, events, options) {
    if (!projectId || typeof projectId !== "string" || projectId.trim() === "") {
      throw new ValidationError(
        "projectId is required and must be a non-empty string"
      );
    }
    if (!Array.isArray(events)) {
      throw new ValidationError("events must be an array");
    }
    if (events.length === 0) {
      throw new ValidationError("events array cannot be empty");
    }
    if (events.length > MAX_BATCH_SIZE) {
      throw new ValidationError(
        `Maximum ${MAX_BATCH_SIZE} events per batch allowed`
      );
    }
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      if (!event || typeof event !== "object") {
        throw new ValidationError(`events[${i}] must be an object`);
      }
      if (!event.webhookId || typeof event.webhookId !== "string") {
        throw new ValidationError(`events[${i}].webhookId is required`);
      }
      if (!event.eventType || typeof event.eventType !== "string") {
        throw new ValidationError(`events[${i}].eventType is required`);
      }
      if (event.payload === void 0 || event.payload === null) {
        throw new ValidationError(`events[${i}].payload is required`);
      }
      if (!Array.isArray(event.targets) || event.targets.length === 0) {
        throw new ValidationError(
          `events[${i}].targets must be a non-empty array`
        );
      }
      for (let j = 0; j < event.targets.length; j++) {
        const target = event.targets[j];
        if (!target?.targetUrl) {
          throw new ValidationError(
            `events[${i}].targets[${j}].targetUrl is required`
          );
        }
        try {
          new URL(target.targetUrl);
        } catch {
          throw new ValidationError(
            `events[${i}].targets[${j}].targetUrl must be a valid URL`
          );
        }
      }
    }
    const requestOptions = options?.idempotencyKey ? { headers: { "Idempotency-Key": options.idempotencyKey } } : void 0;
    const response = await httpClient.post(
      `/v1/events/${projectId}/publish/batch`,
      events,
      requestOptions
    );
    return response.data;
  };
}

// src/modules/events/index.ts
function createEventsModule(httpClient) {
  return {
    single: createPublishEvent(httpClient),
    batch: createPublishEvents(httpClient)
  };
}

// src/modules/sources/index.ts
function createSourcesModule(client) {
  return {
    async list(projectId, params) {
      const response = await client.get(
        `/v1/sources/${projectId}`,
        params
      );
      return response.data;
    },
    async get(projectId, sourceId) {
      const response = await client.get(
        `/v1/sources/${projectId}/${sourceId}`
      );
      return response.data;
    },
    async create(projectId, data) {
      const response = await client.post(
        `/v1/sources/${projectId}`,
        data
      );
      return response.data;
    },
    async update(projectId, sourceId, data) {
      const response = await client.patch(
        `/v1/sources/${projectId}/${sourceId}`,
        data
      );
      return response.data;
    },
    async delete(projectId, sourceId) {
      const response = await client.delete(
        `/v1/sources/${projectId}/${sourceId}`
      );
      return response.data;
    }
  };
}

// src/modules/endpoints/index.ts
function createEndpointsModule(client) {
  return {
    async list(projectId, params) {
      const response = await client.get(
        `/v1/endpoints/${projectId}`,
        params
      );
      return response.data;
    },
    async get(projectId, endpointId) {
      const response = await client.get(
        `/v1/endpoints/${projectId}/${endpointId}`
      );
      return response.data;
    },
    async create(projectId, data) {
      const response = await client.post(
        `/v1/endpoints/${projectId}`,
        data
      );
      return response.data;
    },
    async update(projectId, endpointId, data) {
      const response = await client.patch(
        `/v1/endpoints/${projectId}/${endpointId}`,
        data
      );
      return response.data;
    },
    async delete(projectId, endpointId) {
      const response = await client.delete(
        `/v1/endpoints/${projectId}/${endpointId}`
      );
      return response.data;
    }
  };
}

// src/modules/targets/index.ts
function createTargetsModule(client) {
  return {
    async list(projectId, params) {
      const response = await client.get(
        `/v1/targets/${projectId}`,
        params
      );
      return response.data;
    },
    async get(projectId, targetId) {
      const response = await client.get(
        `/v1/targets/${projectId}/${targetId}`
      );
      return response.data;
    },
    async create(projectId, data) {
      const response = await client.post(
        `/v1/targets/${projectId}`,
        data
      );
      return response.data;
    },
    async update(projectId, targetId, data) {
      const response = await client.patch(
        `/v1/targets/${projectId}/${targetId}`,
        data
      );
      return response.data;
    },
    async delete(projectId, targetId) {
      const response = await client.delete(
        `/v1/targets/${projectId}/${targetId}`
      );
      return response.data;
    }
  };
}

// src/client.ts
var Kyrazo = class {
  /**
   * Events module for publishing events
   */
  events;
  /**
   * Sources module for managing event sources
   */
  sources;
  /**
   * Endpoints module for managing endpoints
   */
  endpoints;
  /**
   * Targets module for managing webhook targets
   */
  targets;
  /**
   * The HTTP client used for requests
   */
  httpClient;
  /**
   * Resolved configuration
   */
  config;
  /**
   * Create a new Kyrazo SDK instance
   *
   * @param config - SDK configuration options
   */
  constructor(config) {
    if (!config.apiKey || typeof config.apiKey !== "string") {
      throw new ValidationError(
        "apiKey is required and must be a non-empty string"
      );
    }
    this.config = resolveConfig(config);
    this.httpClient = new HttpClient(this.config);
    this.events = createEventsModule(this.httpClient);
    this.sources = createSourcesModule(this.httpClient);
    this.endpoints = createEndpointsModule(this.httpClient);
    this.targets = createTargetsModule(this.httpClient);
  }
  /**
   * Get the current SDK configuration
   */
  getConfig() {
    return Object.freeze({ ...this.config });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AuthenticationError,
  DEFAULT_CONFIG,
  Kyrazo,
  KyrazoError,
  LimitExceededError,
  NetworkError,
  NotFoundError,
  RateLimitError,
  ServerError,
  VERSION,
  ValidationError
});
