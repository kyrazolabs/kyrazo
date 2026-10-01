export enum WebhookType {
    RECEIVE = 'receive',
    PUBLISH = 'publish',
}
export enum TargetStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    DELIVERED = 'delivered',
    FAILED = 'failed',
    TIMEOUT = 'timeout',
    NETWORK_ERROR = 'network_error',
}
export enum EventStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    DELIVERED = 'delivered',
    FAILED = 'failed',
    RETRYING = 'retrying',
}
export enum EventPriority {
    LOW = 'low',
    NORMAL = 'normal',
    HIGH = 'high',
    URGENT = 'urgent',
}
export enum ProcessingStatus {
    PENDING = 'pending',
    PROCESSED = 'processed',
    FAILED = 'failed',
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
}

export interface IReceivedEvent<T = Record<string, string>> {
    eventId: string; // UUID Coming with the request
    workspaceId: string;
    namespaceId: string;
    userId?: string;

    source: string;
    sourceId: string;
    sourceType: string;
    ingressId: string;

    receivedAt: Date;
    headers: Record<string, string>;
    body: T;
    rawBody?: string;

    verified: boolean;

    processingStatus: ProcessingStatus;
    processingError?: string;
    associatedEventId?: string;
}
