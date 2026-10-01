import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { DispatcherQueue } from './dispatcher.queue';

// Mock dependencies
const mockDispatchConsumer = {
    enqueue: mock(() => Promise.resolve(['job_1'])),
};

const mockRedis = {
    cache: mock((key, fn) => fn()),
    get: mock(() => Promise.resolve(null)),
    set: mock(() => Promise.resolve('OK')),
};

const mockTargetRepo = {
    getTargetById: mock(() =>
        Promise.resolve({
            _id: 'tar_1',
            url: 'http://target.com',
            config: { rateLimit: 10, rateLimitDuration: 1, retryCount: 3 },
            method: 'POST',
        })
    ),
};

mock.module('@/consumers/queues/dispatch.producer', () => ({
    dispatchProducer: mockDispatchConsumer,
}));

mock.module('@/config', () => ({
    redisConfig: mockRedis,
}));

mock.module('@/services/mongo/target.repo', () => ({
    targetRepository: mockTargetRepo,
}));

mock.module('@/services/mongo/transform.repo', () => ({
    transformRepository: {
        getTransformerById: mock(() => Promise.resolve(null)),
    },
}));

mock.module('@kyrazo/shared', () => ({
    logger: {
        info: () => {},
        error: () => {},
        warn: () => {},
        debug: () => {},
    },
    unprefixId: (id: string) => id,
    Source: {
        findById: mock(() => Promise.resolve(null)),
    },
    Namespace: {
        findOne: mock(() => ({
            lean: mock(() => Promise.resolve(null)),
        })),
    },
    RedisKeys: {
        context: {
            source: (id: string) => `source:${id}`,
            workspaceNamespace: (ws: string, ns: string) => `ws:${ws}:ns:${ns}`,
            workspaceNamespaceTarget: (ws: string, ns: string, t: string) =>
                `ws:${ws}:ns:${ns}:t:${t}`,
            transformCode: (id: string) => `tr:${id}`,
        },
    },
}));

describe('DispatcherQueue', () => {
    let queue: DispatcherQueue;

    beforeEach(() => {
        queue = DispatcherQueue.getInstance();
    });

    it('should enqueue tasks to BullMQ', async () => {
        const event: any = {
            id: 'evt_1',
            workspaceId: 'ws_1',
            namespaceId: 'proj_1',
            targets: [{ targetId: 'tar_1' }],
            meta: { priority: 'normal' },
        };
        const headers: any = { 'X-Test': 'Value' };
        const targets = event.targets;

        await queue.enqueue(event, headers, targets);

        expect(mockDispatchConsumer.enqueue).toHaveBeenCalled();
        const callArgs = mockDispatchConsumer.enqueue.mock.calls[0] as any[];
        expect(callArgs[0]).toBe(event);
        expect(callArgs[1][0].url).toBe('http://target.com');
        expect(callArgs[1][0].method).toBe('POST');
        expect(callArgs[2]).toBe(headers);
    });

    it('should resolve hierarchical transformers (Namespace fallback)', async () => {
        const { Namespace } = require('@kyrazo/shared');
        Namespace.findOne.mockImplementation(() => ({
            lean: mock(() =>
                Promise.resolve({
                    _id: 'ns_1',
                    transformer: 'tr_ns_1',
                })
            ),
        }));

        mockRedis.get.mockImplementation(key => {
            if (key.includes('ws_1:ns_1')) return null; // Namespace cache miss
            return null;
        });

        const mockTransformRepo = require('@/services/mongo/transform.repo').transformRepository;
        mockTransformRepo.getTransformerById.mockImplementation((id: string) =>
            Promise.resolve({ id, code: `code_${id}` })
        );

        const event: any = {
            id: 'evt_2',
            workspaceId: 'ws_1',
            namespaceId: 'ns_1',
            targets: [{ targetId: 'tar_1' }],
        };

        await queue.enqueue(event, {} as any, event.targets);

        const callArgs = mockDispatchConsumer.enqueue.mock.calls[1] as any[];
        expect(callArgs[1][0].transform.id).toBe('tr_ns_1');
    });

    it('should skip Source transformer for type "target" and use Namespace fallback', async () => {
        const { Namespace, Source } = require('@kyrazo/shared');
        Namespace.findOne.mockImplementation(() => ({
            lean: mock(() => Promise.resolve({ _id: 'ns_1', transformer: 'tr_ns_1' })),
        }));
        Source.findById.mockImplementation(() =>
            Promise.resolve({ _id: 'src_1', transformer: 'tr_src_1' })
        );

        const mockTransformRepo = require('@/services/mongo/transform.repo').transformRepository;
        mockTransformRepo.getTransformerById.mockImplementation((id: string) =>
            Promise.resolve({ id, code: `code_${id}` })
        );

        const event: any = {
            id: 'evt_3',
            workspaceId: 'ws_1',
            namespaceId: 'ns_1',
            sourceId: 'src_1',
            targets: [{ targetId: 'tar_1' }],
        };

        await queue.enqueue(event, {} as any, event.targets, 'target');

        const callArgs = mockDispatchConsumer.enqueue.mock.calls[2] as any[];
        // Should use Namespace transformer (tr_ns_1) instead of Source (tr_src_1)
        expect(callArgs[1][0].transform.id).toBe('tr_ns_1');
    });
});
