import { ProcessingStatus } from '../../../types';

export interface SQLIngestEvent {
    event_id: string | number | bigint; // UInt64

    workspace_id: string;
    namespace_id: string;
    user_id: string;

    source_id: string;
    source_type: string;
    ingress_id: string;

    received_at: string; // DateTime64
    created_at: string; // DateTime64
    processed_at: string; // DateTime64

    provider: string;
    provider_event_id: string;
    provider_resource_id: string;

    headers: string;
    body: string;

    verified: boolean;

    processing_status: ProcessingStatus;
    processing_error: string | null;

    associated_event_id: string | null; // UInt64
}
