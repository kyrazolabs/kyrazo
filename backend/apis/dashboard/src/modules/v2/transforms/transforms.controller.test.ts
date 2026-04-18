import { describe, it, expect, mock, spyOn, beforeEach } from 'bun:test';
import { TransformController } from './transforms.controller';
import { transformService } from './transforms.service';

const mockContext = (
    body: any = {},
    params: any = {},
    queries: any = {},
    userId: string = 'user1',
    workspaceId: string = 'workspace1',
    namespaceId: string = 'namespace1'
) => {
    return {
        user: { userId },
        workspace: { workspaceId },
        namespace: { namespaceId },
        req: {
            valid: (type: string) => {
                if (type === 'json') return body;
                if (type === 'param') return params;
                if (type === 'query') return queries;
                return {};
            },
            param: () => params,
            query: () => queries,
        },
        json: (data: any, status: number = 200) => ({ data, status }),
        get: (key: string) => key,
    } as any;
};

describe('TransformController', () => {
    beforeEach(() => {
        mock.restore();
    });

    it('createTransform should return 201 on success', async () => {
        const input = { name: 'T1', code: 'return event;' };
        spyOn(transformService, 'createTransform').mockResolvedValue({ id: 'tr_1' } as any);

        const c = mockContext(input);
        const result: any = await TransformController.createTransform(c);

        expect(result.status).toBe(201);
        expect(result.data.success).toBe(true);
    });

    it('getTransforms should support pagination', async () => {
        spyOn(transformService, 'getTransforms').mockResolvedValue({ transforms: [], total: 0 });

        const c = mockContext({}, {}, { limit: '10', page: '1' });
        const result: any = await TransformController.getTransforms(c);

        expect(result.status).toBe(200);
        expect(result.data.data).toEqual([]);
    });

    it('rollback should return updated transform', async () => {
        spyOn(transformService, 'rollback').mockResolvedValue({ id: 'tr_1', version: 2 } as any);

        const c = mockContext({}, { id: 'tr_1', version: '2' });
        const result: any = await TransformController.rollback(c);

        expect(result.status).toBe(200);
        expect(result.data.data.version).toBe(2);
    });

    it('testTransform should return execution details', async () => {
        const testResult = { result: { ok: true }, logs: ['log1'], executionTimeMs: 5 };
        spyOn(transformService, 'testTransform').mockResolvedValue(testResult);

        const c = mockContext({ code: 'return event;', payload: {} });
        const result: any = await TransformController.testTransform(c);

        expect(result.status).toBe(200);
        expect(result.data.data.result.ok).toBe(true);
    });
});
