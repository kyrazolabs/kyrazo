export interface IEventPayload {
    id: string; // UUID
    user_id: string;
    event_type_id: string;
    name: string;
    payload_data: Record<string, any>;
    is_template: boolean;
    description: string;
    created_at: Date;
    updated_at: Date;
}
