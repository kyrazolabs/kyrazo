export interface IWebhookHeaders {
    'X-Webhook-Id': string;
    'X-Webhook-Event': string;
    'X-Webhook-Timestamp': string; // unix ms
    'X-Webhook-Workspace': string;
    'X-Webhook-Namespace': string;
    'X-Webhook-Attempt': string;
    'X-Webhook-Signature': string;
    'X-Webhook-Nonce': string;
    'X-Webhook-Version': string;
    'X-Webhook-Schema': string;
    [key: string]: string;
}

export interface IDispatchedTarget {
    targetId: string;
    targetUrl: string;
    attempts?: number;
    lastAttemptAt?: Date | null;
    nextRetryAt?: Date | null;
    responseCode?: number;
    responseBody?: Record<string, any>;
    responseTimeMs?: number;
    errorMessage?: string;
    customHeaders?: Record<string, string>;
    method?: string;
}

export interface IDispatchedEvent {
    id: string; // eventId
    type: string; // eventType
    timestamp: number; // unix ms

    workspaceId: string;
    namespaceId: string;

    sourceId: string | null;
    sourceType: string | null;

    provider?: {
        name: string;
        eventId: string;
        resourceId?: string;
    };

    data: {
        object: Record<string, any>;
        previous: Record<string, any> | null;
    };

    targets: IDispatchedTarget[];

    meta?: {
        priority: 'low' | 'normal' | 'high' | 'urgent';
        maxRetries: number;
        insertedAt: Date;
        nonce: string;
        version: string;
        source?: string;
        ip?: string;
        userAgent?: string;
    };
}

export interface SignaturePayload {
    body: string; // raw JSON string before sending
    timestamp: number; // UNIX ms
    nonce: string; // random unique value
    version: string; // signature version
}

export interface SignatureResult {
    signature: string;
    timestamp: number;
    nonce: string;
    version: string;
}

export interface IConfiguredTarget {
    type: 'target' | 'endpoint' | 's3Bucket' | 'asqs';
    targetId: string;
    url: string;
    priority: number;
    rateLimit?: number;
    rateLimitDuration?: number;
    retryCount?: number;
    customHeaders?: Record<string, string>;
    method?: string;
}
export interface IDispatchJobData {
    event: IDispatchedEvent;
    target: IConfiguredTarget;
    headers: IWebhookHeaders;
    deliveryId: string;
    transform?: {
        id: string;
        code: string;
    };
}
