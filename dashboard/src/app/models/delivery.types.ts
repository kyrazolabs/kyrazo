import { SourceType } from "./source.types";
export enum TargetStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  DELIVERED = "delivered",
  FAILED = "failed",
  TIMEOUT = "timeout",
  NETWORK_ERROR = "network_error",
}

export interface IDeliveryAttempt {
  delivery_id: string;
  workspace_id: string;
  producer_id: string;
  webhook_type: SourceType;
  event_id: string;
  event_type: string;
  event_model: "PublishedEvent" | "ReceivedEvent" | "RoutedEvent";
  webhook_id: string; // Keeping API key
  endpoint_id?: string;
  target: string;
  status: TargetStatus;
  attempt_number: number;
  request_header: string;
  request_body: string;
  response_code?: number;
  response_header: string;
  response_body: string;
  response_time_ms?: number;
  scheduled_at: string;
  processed_at: string;
  error: string;
}

export interface GetDAResponse {
  delivery_id: string;
  workspace_id: string;
  producer_id: string;
  webhook_type: SourceType;
  event_id: string;
  event_type: string;
  event_model: "PublishedEvent" | "ReceivedEvent" | "RoutedEvent";
  webhook_id: string;
  endpoint_id?: string;
  target: string;
  status: TargetStatus;
  attempt_number: number;
  request_header: string;
  request_body: string;
  response_code?: number;
  response_header: string;
  response_body: string;
  response_time_ms?: number;
  scheduled_at: string;
  processed_at: string;
  error: string;
}

export interface GetDAWResponse {
  delivery_id: string;
  workspace_id: string;
  producer_id: string;
  webhook_type: SourceType;
  event_id: string;
  event_model: "PublishedEvent" | "ReceivedEvent" | "RoutedEvent";
  webhook_id: string;
  endpoint_id?: string;
  target: string;
  status: TargetStatus;
  attempt_number: number;
  request_header: string;
  request_body: string;
  response_code?: number;
  response_header: string;
  response_body: string;
  response_time_ms?: number;
  scheduled_at: string;
  processed_at: string;
  error: string;
}
