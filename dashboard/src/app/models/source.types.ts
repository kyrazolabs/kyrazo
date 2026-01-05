import { IEndpoint } from "./endpoint.types";

export enum SourceStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  PAUSED = "paused",
}
export enum SourceType {
  RECEIVE = "receive",
  PUBLISH = "publish",
  FORWARD = "forward",
}
export enum SignatureAlgorithm {
  HMAC_SHA256 = "hmac-sha256",
  HMAC_SHA1 = "hmac-sha1",
}
export enum backoffStrategy {
  EXPONENTIAL = "exponential",
  FIXED = "fixed",
}

export interface ISource {
  _id: string;
  userId: string;
  workspaceId: string;
  name: string;
  description: string;
  status: SourceStatus;

  type: SourceType;
  endpoints?: IEndpoint[];
  // ingressIds: Array<string>;
  events: Array<string>;
  eventTypes: Array<string>;

  // secret: string;
  // iv: string;
  // isEnabled: boolean;
  // signatureAlgorithm: SignatureAlgorithm;

  ingressId?: string;
  service?: string;
  forwarding?: boolean;

  retryPolicy: {
    maxAttempts: number;
    backoffStrategy: backoffStrategy;
    interval: number;
  };
}

export interface CreateSourceRequest {
  name: string;
  description?: string;
  status: SourceStatus;

  type: SourceType;
  service?: string; // Required for receive webhooks
  eventTypes?: Array<string>;
  endpoints?: Array<string>; // Required for forward webhooks

  // Receive webhook specific fields
  forwarding?: boolean;

  retryPolicy?: {
    maxAttempts: number;
    backoffStrategy: backoffStrategy;
    interval: number;
  };

  authentication?: {
    enabled?: boolean;
    type?: string;
    service?: { secret: string };
    hmac?: {
      algorithm: string;
      encoding: string;
      signatureHeaderKey: string;
      webhookSigningSecret: string;
    };
    basicAuth?: { username: string; password: string };
    apiKey?: { headerKey: string; apiKey: string };
  };

  secret?: string;
}

export interface CreateSourceResponse {
  secret?: string;
  ingress?: string;
}

export interface UpdateSourceRequest {
  name?: string;
  description?: string;
  status?: SourceStatus;

  type?: SourceType;
  eventTypes?: Array<string>;
  forwarding?: boolean;
  endpoints?: Array<string>;

  retryPolicy?: {
    maxAttempts?: number;
    backoffStrategy?: backoffStrategy;
    interval?: number;
  };
}

export interface UpdateSourceResponse {
  source: ISource;
}

export interface GetSourceResponse {
  _id: string;
  userId: string;
  workspaceId: string;
  name: string;
  description: string;
  status: SourceStatus;

  type: SourceType;
  endpoints?: IEndpoint[];
  // ingressIds: Array<string>;
  ingressId?: string;
  service?: string;
  forwarding?: boolean;

  events: Array<string>;
  eventTypes: Array<string>;

  // secret: string;
  // iv: string;
  // isEnabled: boolean;
  // signatureAlgorithm: SignatureAlgorithm;

  retryPolicy: {
    maxAttempts: number;
    backoffStrategy: backoffStrategy;
    interval: number;
  };
}

export interface GetSourcesResponse {
  _id: string;
  id?: string; // Fallback
  userId: string;
  workspaceId: string;
  name: string;
  description: string;
  status: SourceStatus;

  type: SourceType;
  service?: string; // Added service property
  // endpointIds: Array<string>;
  // ingressIds: Array<string>;
  events: Array<string>;
  eventTypes: Array<string>;

  // secret: string;
  // iv: string;
  // isEnabled: boolean;
  // signatureAlgorithm: SignatureAlgorithm;

  retryPolicy: {
    maxAttempts: number;
    backoffStrategy: backoffStrategy;
    interval: number;
  };
}
