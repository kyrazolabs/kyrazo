import type { IReceivedEvent } from '@/types/events/event.types';
import type { SQLIngestEvent } from '@kyrazo/shared';

export class ReceiverTransformer {
    static instance: ReceiverTransformer;

    private constructor() {}

    public static getInstance(): ReceiverTransformer {
        if (!ReceiverTransformer.instance) {
            ReceiverTransformer.instance = new ReceiverTransformer();
        }
        return ReceiverTransformer.instance;
    }

    public transform<T = any>(event: IReceivedEvent<T>): SQLIngestEvent {
        const toCHDate = (date: Date | string | number) =>
            new Date(date).toISOString().slice(0, 23).replace('T', ' ');

        return {
            event_id: event.eventId,

            workspace_id: event.workspaceId,
            namespace_id: event.namespaceId,
            user_id: event.userId ?? '',

            source_id: event.sourceId,
            source_type: event.sourceType,
            ingress_id: event.ingressId,

            received_at: toCHDate(event.receivedAt),
            created_at: toCHDate(event.receivedAt),
            processed_at: toCHDate(event.receivedAt),

            provider: event.source,
            provider_event_id: (event.body as any).id ?? '',
            provider_resource_id: (event.body as any).resource_id ?? '',

            headers: JSON.stringify(event.headers),
            body: JSON.stringify(event.body),

            verified: event.verified,

            processing_status: event.processingStatus,
            processing_error: event.processingError ?? '',

            associated_event_id: event.associatedEventId ?? '',
        };
    }
}

export const receiverTransformer = ReceiverTransformer.getInstance();
