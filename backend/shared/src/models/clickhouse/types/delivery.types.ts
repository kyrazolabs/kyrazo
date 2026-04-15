export enum DeliveryStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    DELIVERED = 'delivered',
    FAILED = 'failed',
    TIMEOUT = 'timeout',
    NETWORK_ERROR = 'network_error',
}

export interface SQLDeliveryAttempt {
    delivery_id: string | number | bigint; // UInt64

    workspace_id: string;
    namespace_id: string;

    event_id: string; // UInt64
    event: string;

    source_id: string | null;
    source_type: string | null;

    target_id: string;
    target_url: string;

    status: DeliveryStatus;
    attempt_number: number;

    request_method: string;
    request_header: string;
    request_body: string;

    response_code: number | null;
    response_header: string;
    response_body: string;
    response_time_ms: number | null;

    scheduled_at: string; // DateTime64
    processed_at: string | null; // DateTime64

    error: string | null;
}
