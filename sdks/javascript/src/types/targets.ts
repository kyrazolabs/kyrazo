/**
 * Targets Type Definitions
 */

import type { PaginationParams } from "./common";

export type TargetMethod = "POST" | "PUT" | "PATCH" | "GET" | "DELETE";

export interface TargetConfig {
  timeout: number;
  retryCount: number;
  rateLimit?: number;
  rateLimitDuration: number;
}

export interface Target {
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
