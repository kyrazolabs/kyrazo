import { describe, it, expect, beforeEach } from 'bun:test';
import { DispatcherTransformer } from './dispatcher.transformer';

describe('DispatcherTransformer', () => {
    let transformer: DispatcherTransformer;

    beforeEach(() => {
        transformer = DispatcherTransformer.getInstance();
    });

    it('should transform raw event into IDispatchedEvent', () => {
        const rawEvent = {
            eventId: 'evt_1',
            eventType: 'test.event',
            workspaceId: 'ws_1',
            namespaceId: 'proj_1',
            data: { foo: 'bar' },
            targets: [
                {
                    targetId: 'tar_1',
                    targetUrl: 'http://example.com/1',
                    method: 'PUT',
                },
            ],
            meta: {
                priority: 'high',
                maxRetries: 5,
            },
        };

        const result = transformer.transform(rawEvent);

        expect(result.id).toBe(rawEvent.eventId);
        expect(result.type).toBe(rawEvent.eventType);
        expect(result.workspaceId).toBe(rawEvent.workspaceId);
        expect(result.namespaceId).toBe(rawEvent.namespaceId);
        expect(result.data.object).toEqual(rawEvent.data);
        expect(result.targets.length).toBe(1);
        expect(result.targets![0]!.targetId).toBe('tar_1');
        expect(result.targets![0]!.method).toBe('PUT');
        expect(result.meta!.priority).toBe('high');
        expect(result.meta!.maxRetries).toBe(5);
    });

    it('should handling missing optional fields with defaults', () => {
        const minimalEvent = {
            eventId: 'evt_1',
            workspaceId: 'ws_1',
        };

        const result = transformer.transform(minimalEvent);

        expect(result.type).toBeUndefined();
        expect(result.data.object).toEqual({});
        expect(result.targets).toEqual([]);
        expect(result.meta!.priority).toBe('normal');
        expect(result.meta!.maxRetries).toBe(3);
        expect(result.meta!.nonce).toBeDefined();
    });
});
