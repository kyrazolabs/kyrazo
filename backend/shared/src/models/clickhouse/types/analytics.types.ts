export interface SQLAnalyticsDispatchDay {
    namespace_id: string;
    target_id: string | null;
    event_type: string | null;
    response_code: number | null;
    bucket_day: string; // Date string YYYY-MM-DD

    total_deliveries: number;
    successful_deliveries: number;
    failed_deliveries: number;
    pending_deliveries: number;
    delivery_time_sum: number;
}

export interface SQLAnalyticsIngestDay {
    namespace_id: string;
    source_id: string | null;
    processing_status: number | null;
    bucket_day: string; // Date string YYYY-MM-DD

    total_events: number;
    successful_events: number;
    failed_events: number;
    pending_events: number;
}
