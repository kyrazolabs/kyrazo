/**
 * Endpoints Type Definitions
 */

import type { PaginationParams } from "./common";

export type EndpointStatus = "active" | "inactive";

export interface EndpointConfig {
  timeout: number;
  retryCount: number;
  rateLimit?: number;
  rateLimitDuration: number;
}

export interface Endpoint {
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

export interface CreateEndpointInput {
  name: string;
  status: EndpointStatus;
  url: string;
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
