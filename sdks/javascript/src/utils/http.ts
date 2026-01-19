/**
 * HTTP utilities
 */

import type { KyrazoConfig } from "../config";
import {
  createErrorFromResponse,
  NetworkError,
  type APIErrorResponse,
} from "../errors";
import { VERSION } from "../version";

/**
 * HTTP method types
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * HTTP request configuration
 */
export interface HttpRequestConfig {
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
export interface HttpResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

/**
 * HTTP Client for making API requests
 */
export class HttpClient {
  private readonly baseURL: string;
  private readonly apiKey: string;
  private readonly defaultTimeout: number;
  private readonly maxRetries: number;
  private readonly customHeaders: Record<string, string>;

  constructor(
    config: Required<Omit<KyrazoConfig, "headers">> &
      Pick<KyrazoConfig, "headers">,
  ) {
    this.baseURL = config.baseURL.replace(/\/$/, ""); // Remove trailing slash
    this.apiKey = config.apiKey;
    this.defaultTimeout = config.timeout;
    this.maxRetries = config.maxRetries;
    this.customHeaders = config.headers ?? {};
  }

  /**
   * Build full URL with query parameters
   */
  private buildUrl(path: string, params?: Record<string, any>): string {
    const url = new URL(path, this.baseURL);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Build request headers
   */
  private buildHeaders(
    additionalHeaders?: Record<string, string>,
  ): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-api-key": this.apiKey,
      "User-Agent": `kyrazo-sdk/${VERSION}`,
      ...this.customHeaders,
      ...additionalHeaders,
    };
  }

  /**
   * Execute HTTP request with retry logic
   */
  async request<T>(config: HttpRequestConfig): Promise<HttpResponse<T>> {
    const url = this.buildUrl(config.path, config.params);
    const headers = this.buildHeaders(config.headers);
    const timeout = config.timeout ?? this.defaultTimeout;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        // Merge signals if provided
        const signal = config.signal
          ? this.mergeAbortSignals(config.signal, controller.signal)
          : controller.signal;

        const response = await fetch(url, {
          method: config.method,
          headers,
          body: config.body ? JSON.stringify(config.body) : undefined,
          signal,
        });

        clearTimeout(timeoutId);

        // Parse response body
        const contentType = response.headers.get("content-type");
        let data: T;

        if (contentType?.includes("application/json")) {
          data = (await response.json()) as T;
        } else {
          data = (await response.text()) as unknown as T;
        }

        // Handle error responses
        if (!response.ok) {
          const errorBody = data as unknown as APIErrorResponse | null;
          const requestId = response.headers.get("x-request-id") ?? undefined;
          throw createErrorFromResponse(
            response.status,
            errorBody,
            requestId,
            response.headers,
          );
        }

        return {
          data,
          status: response.status,
          headers: response.headers,
        };
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx) or abort
        if (
          error instanceof Error &&
          (error.name === "AbortError" ||
            ((error as { statusCode?: number }).statusCode !== undefined &&
              (error as { statusCode?: number }).statusCode! < 500))
        ) {
          throw error;
        }

        // Add exponential backoff for retries
        if (attempt < this.maxRetries) {
          await this.delay(Math.pow(2, attempt) * 100);
        }
      }
    }

    // All retries exhausted
    if (lastError?.name === "AbortError") {
      throw new NetworkError("Request timed out");
    }
    throw lastError ?? new NetworkError("Request failed after retries");
  }

  /**
   * Merge multiple abort signals
   */
  private mergeAbortSignals(...signals: AbortSignal[]): AbortSignal {
    const controller = new AbortController();

    for (const signal of signals) {
      if (signal.aborted) {
        controller.abort(signal.reason);
        break;
      }
      signal.addEventListener("abort", () => controller.abort(signal.reason), {
        once: true,
      });
    }

    return controller.signal;
  }

  /**
   * Delay helper for retry backoff
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Convenience methods
   */
  async get<T>(
    path: string,
    params?: any,
    options?: {
      headers?: Record<string, string>;
      timeout?: number;
      signal?: AbortSignal;
    },
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ method: "GET", path, params, ...options });
  }

  async post<T>(
    path: string,
    body?: unknown,
    options?: {
      headers?: Record<string, string>;
      timeout?: number;
      signal?: AbortSignal;
    },
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ method: "POST", path, body, ...options });
  }

  async put<T>(
    path: string,
    body?: unknown,
    options?: {
      headers?: Record<string, string>;
      timeout?: number;
      signal?: AbortSignal;
    },
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ method: "PUT", path, body, ...options });
  }

  async patch<T>(
    path: string,
    body?: unknown,
    options?: {
      headers?: Record<string, string>;
      timeout?: number;
      signal?: AbortSignal;
    },
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ method: "PATCH", path, body, ...options });
  }

  async delete<T>(
    path: string,
    options?: {
      headers?: Record<string, string>;
      timeout?: number;
      signal?: AbortSignal;
    },
  ): Promise<HttpResponse<T>> {
    return this.request<T>({ method: "DELETE", path, ...options });
  }
}
