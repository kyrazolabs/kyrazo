/**
 * Endpoints Type Definitions
 */

import type { PaginationParams } from "./common";

export type EndpointStatus = "active" | "inactive";
export type EndpointMethod = "POST" | "PUT" | "PATCH";

export interface EndpointConfig {
  timeout: number;
  retryCount: number;
  rateLimit?: number;
  rateLimitDuration: number;
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

export interface CreateEndpointInput {
  name: string;
  status: EndpointStatus;
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
  status?: EndpointStatus;
}
