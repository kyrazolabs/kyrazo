import { describe, it, expect, beforeEach } from 'bun:test';
import { ReceiverTransformer } from './receiver.transformer';
import { ProcessingStatus } from '@kyrazo/shared';

describe('ReceiverTransformer', () => {
    let transformer: ReceiverTransformer;

    beforeEach(() => {
        transformer = ReceiverTransformer.getInstance();
    });

    it('should transform IReceivedEvent to SQLIngestEvent', () => {
        const receivedEvent: any = {
            eventId: 'evt_1',
            workspaceId: 'ws_1',
            namespaceId: 'proj_1',
            userId: 'user_1',
            sourceId: 'src_1',
            sourceType: 'paypal',
            ingressId: 'ing_1',
            receivedAt: new Date('2023-01-01T00:00:00Z'),
            source: 'paypal',
            body: { id: 'pp_1', resource_id: 'res_1' },
            headers: { 'content-type': 'application/json' },
            verified: true,
            processingStatus: 'processed',
            processingError: null,
            associatedEventId: 'assoc_1',
        };

        const result = transformer.transform(receivedEvent);

        expect(result.event_id).toBe(receivedEvent.eventId);
        expect(result.workspace_id).toBe(receivedEvent.workspaceId);
        expect(result.namespace_id).toBe(receivedEvent.namespaceId);
        expect(result.user_id).toBe(receivedEvent.userId);
        expect(result.source_id).toBe(receivedEvent.sourceId);
        expect(result.provider).toBe(receivedEvent.source);
        expect(result.provider_event_id).toBe('pp_1');
        expect(result.headers).toBe(JSON.stringify(receivedEvent.headers));
        expect(result.body).toBe(JSON.stringify(receivedEvent.body));
        expect(result.verified).toBe(true);
        expect(result.processing_status).toBe(ProcessingStatus.PROCESSED);
    });
});
