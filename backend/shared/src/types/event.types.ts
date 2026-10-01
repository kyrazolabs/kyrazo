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

export interface IPublishedEvent {
    eventId: string;
    workspaceId: string;
    sourceType: 'publish' | 'receive';
    namespaceId: string;
    eventType: string;
    timestamp: number;
    data: Record<string, any>;
    previous: Record<string, any> | null;

    // قائمة الـ Targets
    targets: {
        targetId: string;
        targetUrl: string;
        attempts?: number;
        lastAttemptAt?: Date | null;
        nextRetryAt?: Date | null;
        responseCode?: number;
        responseBody?: Record<string, any>;
        responseTimeMs?: number;
        errorMessage?: string;
    }[];

    meta: {
        priority: 'low' | 'normal' | 'high' | 'urgent';
        maxRetries: number;
        insertedAt: Date; // مفيد لمعرفة وقت إدخاله بالنظام
    };
}

export interface IForwardedEvent {
    eventId: string;
    workspaceId: string;
    namespaceId: string;
    sourceId: string;
    ingressId: string;
    userId: string;
    source: string;
    sourceType: 'publish' | 'receive';

    headers: Record<string, string>;
    body: any;

    processingStatus: 'pending' | 'processed' | 'failed';
    associatedEventId: string;

    targets: Array<string>;
    authenticating: boolean;

    meta: {
        priority: 'low' | 'normal' | 'high' | 'urgent';
        maxRetries: number;
        insertedAt: Date;
    };
}

export interface IReceivedEvent {
    eventId: string;
    workspaceId: string;
    namespaceId: string;
    sourceId: string;
    ingressId: string;
    userId?: string;
    source: string;
    sourceType: 'publish' | 'receive' | 'forward';

    receivedAt: Date;
    headers: Record<string, string>;
    body: Record<string, string>;
    rawBody?: string;

    processingStatus: 'pending' | 'processed' | 'failed';
    processingError?: string;
    associatedEventId?: string;
}

export interface SQLPublishedEvent {
    event_id: string;
    workspace_id: string;
    namespace_id: string;
    source_id: string;
    producer_id: string;
    event_type: string;

    timestamp: number;
    data: string; // JSON string

    delivered_all: number;

    meta_priority: 'low' | 'normal' | 'high' | 'urgent';
    meta_max_retries: number;
    meta_inserted_at: string; // ISO timestamp
}

export interface SQLPublishedEventTarget {
    event_id: string;
    target_id: string;
    target_url: string;
    status: 'pending' | 'processing' | 'delivered' | 'failed' | 'timeout' | 'network_error';
}

export interface SQLReceivedEvent {
    event_id: string;
    source_id: string;
    workspace_id: string;
    namespace_id: string;
    user_id: string;
    ingress_id: string;
    source: string;

    received_at: string;
    created_at: string;
    updated_at: string;

    headers: string;
    body: string;
    verified: boolean;

    processing_status: 'pending' | 'processed' | 'failed';
    processing_error: string;

    associated_event_id: string;
    route_to?: string | null;
    route_priority: 'low' | 'normal' | 'high' | 'urgent';
    route_max_retries: number;
    route_inserted_at: string;
}

export interface SQLRoutedEvent {
    route_id: string;
    workspace_id: string;
    namespace_id: string;
    user_id: string;
    source_id: string;
    target_url: string;
    name: string;
    description: string;
    is_active: number;
    secret: string;
    created_at: string;
    updated_at: string;
}
