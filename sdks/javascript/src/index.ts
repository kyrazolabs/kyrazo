/**
 * Kyrazo SDK - Official JavaScript/TypeScript SDK
 *
 * A production-ready SDK for the Kyrazo webhook delivery platform.
 * Provides type-safe methods for publishing events to webhook targets.
 *
 * @packageDocumentation
 * @module @kyrazo/sdk
 *
 * @example Basic Usage
 * ```typescript
 * import { Kyrazo } from "@kyrazo/sdk";
 *
 * const kyrazo = new Kyrazo({
 *   apiKey: "your-api-key",
 *   baseURL: "https://api.kyrazo.com"
 * });
 * ```
 */

// Main client
export { Kyrazo } from "./client";

// Configuration
export { type KyrazoConfig, DEFAULT_CONFIG } from "./config";

// Errors
export {
  KyrazoError,
  AuthenticationError,
  ValidationError,
  NotFoundError,
  RateLimitError,
  LimitExceededError,
  ServerError,
  NetworkError,
  type APIErrorResponse,
} from "./errors";

// Module Classes
export type { SourcesModule } from "./modules/sources";
export type { EndpointsModule } from "./modules/endpoints";
export type { TargetsModule } from "./modules/targets";
export type { EventsModule } from "./modules/events";

// Types
export type {
  // Common types
  APIResponse,
  ResponseMeta,
  PaginationParams,
  PaginatedResponse,
  RequestOptions,
  EventTarget,
  EventData,
  Timestamps,
} from "./types/common";

export type {
  Source,
  CreateSourceInput,
  UpdateSourceInput,
  FilterSourcesInput,
  SourceStatus,
  SourceService,
  SourceAuthType,
} from "./types/sources";

export type {
  Endpoint,
  CreateEndpointInput,
  UpdateEndpointInput,
  FilterEndpointsInput,
  EndpointStatus,
  EndpointConfig,
} from "./types/endpoints";

export type {
  Target,
  CreateTargetInput,
  UpdateTargetInput,
  FilterTargetsInput,
  TargetMethod,
  TargetConfig,
} from "./types/targets";

export type {
  EventPriority,
  EventStatus,
  PublishEventPayload,
  PublishEventResponse,
  BatchPublishEventResponseItem,
  BatchPublishEventResponse,
} from "./types/events";

// Version
export { VERSION } from "./version";
