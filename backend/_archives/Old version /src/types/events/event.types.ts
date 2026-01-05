export enum WebhookType {
  RECEIVE = "receive",
  PUBLISH = "publish",
  FORWARD = "forward",
}
export enum TargetStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  DELIVERED = "delivered",
  FAILED = "failed",
  TIMEOUT = "timeout",
  NETWORK_ERROR = "network_error",
}
export enum EventStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  DELIVERED = "delivered",
  FAILED = "failed",
  RETRYING = "retrying",
}
export enum EventPriority {
  LOW = "low",
  NORMAL = "normal",
  HIGH = "high",
  URGENT = "urgent",
}
export enum ProcessingStatus {
  PENDING = "pending",
  PROCESSED = "processed",
  FAILED = "failed",
}

export interface IPublishEvent extends Document {
  eventId: string;
  workspaceId: string;
  webhookId: string;
  webhookType: WebhookType;
  producerId: string;
  eventType: string;
  timestamp: number;
  data: Record<string, any>;

  // قائمة الـ Targets
  targets: {
    targetId?: string;
    targetUrl: string;
    attempts: number;
  }[];

  status: TargetStatus;
  deliveredAll: boolean;

  meta: {
    priority: EventPriority;
    maxRetries: number;
    insertedAt: Date; // مفيد لمعرفة وقت إدخاله بالنظام
  };
}

export interface IReceivedEvent {
  eventId: string; // UUID Coming with the request
  source: string; //(e.g., 'stripe', 'paypal')
  workspaceId: string;
  webhookId: string;
  ingressId: string;
  userId?: string;

  receivedAt: Date;
  headers: Map<string, string>;
  body: any;
  processingStatus: ProcessingStatus; // حالة المعالجة
  verified: boolean;
  processingError?: string;
  associatedEventId?: string;

  // Options
  routeTo?: string;
  routeToMeta?: {
    priority?: EventPriority;
    maxRetries?: number;
    insertedAt?: Date;
  };
}