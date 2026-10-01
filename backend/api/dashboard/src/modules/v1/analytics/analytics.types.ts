export interface IAnalyticsDispatchResponse {
    stats: {
        total_targets: number;
        active_targets?: number; // Optional as older clients might not assume it
        total_deliveries: number;
        successful_deliveries: number;
        failed_deliveries: number;
        pending_deliveries: number;
        average_delivery_time: number | null;
        success_rate: number;
    };
    deliveryTrends: {
        day: string;
        target: string;
        successful: number;
        failed: number;
    }[];
    topEventTypes: {
        target: string;
        event_type: string;
        total: number;
    }[];
    statusCodeDistribution: {
        target: string;
        response_code: number;
        total: number;
    }[];
}

export interface IAnalyticsIngestResponse {
    stats: {
        ingests: number;
        total_events: number;
        successful_events: number;
        failed_events: number;
        pending_events: number;
        success_rate: number;
    };
    receiveTrends: {
        day: string;
        events: number;
    }[];
    topSources: {
        source: string;
        total: number;
    }[];
    processStatusDistribution: {
        processing_status: string;
        total: number;
    }[];
    failureTrends: {
        day: string;
        total: number;
    }[];
}
