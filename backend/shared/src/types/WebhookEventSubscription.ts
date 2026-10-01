export interface ISourceEventSubscription {
    id: string; // UUID
    source_id: string; // FK to sources
    event_type_id: string; // FK to event_types
    filter_conditions: Record<string, any>;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
