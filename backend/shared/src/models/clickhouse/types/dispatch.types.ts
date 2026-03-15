import { EventPriority } from '../../../types';

export interface SQLDispatchedEvent {
    event_id: string; // UInt64

    workspace_id: string;
    namespace_id: string;
    event_type: string;

    occurred_at: string; // DateTime64

    data: string; // JSON string
    previous: string | null; // JSON string

    target_id: string;
    target_url: string;

    meta_priority: EventPriority;
    meta_max_retries: number;

    meta_inserted_at: string; // DateTime64
}
