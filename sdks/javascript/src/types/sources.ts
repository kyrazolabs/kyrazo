/**
 * Sources Type Definitions
 */

import type { PaginationParams } from "./common";

export type SourceStatus = "active" | "inactive";
export type SourceService = "stripe" | "paypal";
export type SourceAuthType = "service";

export interface SourceRetryPolicy {
  maxAttempts: number;
}

export interface SourceAuthentication {
  enabled: boolean;
  type?: SourceAuthType;
  service?: {
    secret: string;
  };
}

export interface Source {
  _id: string;
  name: string;
  description?: string;
  service: SourceService;
  status: SourceStatus;
  forwarding: boolean;
  endpoints?: string[];
  eventTypes: string[];
  retryPolicy?: SourceRetryPolicy;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSourceInput {
  name: string;
  description?: string;
  service: SourceService;
  status?: SourceStatus;
  forwarding?: boolean;
  endpoints?: string[];
  eventTypes?: string[];
  retryPolicy?: SourceRetryPolicy;
  authentication?: SourceAuthentication;
}

export interface UpdateSourceInput extends Partial<
  Omit<CreateSourceInput, "service" | "authentication">
> {}

export interface FilterSourcesInput extends PaginationParams {
  q?: string;
  status?: SourceStatus;
  tags?: string;
}
