/**
 * Common Type Definitions
 */

export interface PaginationParams {
  limit?: number;
  page?: number;
}

export interface PaginatedResponse<T> {
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

export interface APIResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    requestId?: string;
    retryAfter?: number;
    remainingRequests?: number;
  };
}

export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

export interface EventTarget {
  targetId: string;
  targetUrl?: string;
  headers?: Record<string, string>;
}

export type EventData = Record<string, unknown>;

export interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  signal?: AbortSignal;
}

export interface ResponseMeta {
  requestId?: string;
  [key: string]: unknown;
}
