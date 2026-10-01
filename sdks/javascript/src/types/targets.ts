/**
 * Targets Type Definitions
 */

import type { PaginationParams } from "./common";

export type TargetMethod = "POST" | "PUT" | "PATCH";

export interface TargetConfig {
  timeout: number;
  retryCount: number;
  rateLimit?: number;
  rateLimitDuration: number;
}

/**
 * Represents a webhook delivery target configuration.
 */
export interface Target {
  /** Unique ID for the target */
  id: string;
  /** Human-readable name */
  name: string;
  /** Destination URL for webhook events */
  url: string;
  /** HTTP method to use for delivery (POST, PUT, or PATCH) */
  method: TargetMethod;
  /** Optional description */
  description?: string;
  /** Whether this target is currently active */
  enabled: boolean;
  /** Technical configuration for delivery */
  config: TargetConfig;
  /** Optional custom headers to include in delivery */
  customHeaders?: Record<string, string>;
  /** ISO 8601 timestamp of creation */
  createdAt: string;
  /** ISO 8601 timestamp of last update */
  updatedAt: string;
}

/**
 * Represents a webhook endpoint configuration.
 */
export interface Endpoint {
  /** Unique ID for the endpoint */
  id: string;
  /** Human-readable name */
  name: string;
  /** Current operational status */
  status: EndpointStatus;
  /** Destination URL for webhook events */
  url: string;
  /** HTTP method to use for delivery (POST, PUT, or PATCH) */
  method: EndpointMethod;
  /** Optional description */
  description?: string;
  /** Whether this endpoint is currently enabled */
  enabled: boolean;
  /** Technical configuration for delivery */
  config: EndpointConfig;
  /** Optional custom headers to include in delivery */
  customHeaders?: Record<string, string>;
  /** ISO 8601 timestamp of creation */
  createdAt: string;
  /** ISO 8601 timestamp of last update */
  updatedAt: string;
}

export type EndpointMethod = "POST" | "PUT" | "PATCH";

export type EndpointStatus = "active" | "disabled" | "failed";

export interface EndpointConfig {
  timeout: number;
  retryCount: number;
  rateLimit?: number;
  rateLimitDuration: number;
}

export interface CreateTargetInput {
  name: string;
  url: string;
  method?: TargetMethod;
  description?: string;
  enabled?: boolean;
  config: TargetConfig;
  customHeaders?: Record<string, string>;
}

export interface UpdateTargetInput extends Partial<CreateTargetInput> {}

export interface FilterTargetsInput extends PaginationParams {
  q?: string;
  enabled?: boolean;
}

export interface CreateEndpointInput {
  name: string;
  url: string;
  method?: EndpointMethod;
  description?: string;
  enabled?: boolean;
  config: EndpointConfig;
  customHeaders?: Record<string, string>;
}

export interface UpdateEndpointInput extends Partial<CreateEndpointInput> {}

export interface FilterEndpointsInput extends PaginationParams {
  q?: string;
  enabled?: boolean;
  status?: EndpointStatus;
}
