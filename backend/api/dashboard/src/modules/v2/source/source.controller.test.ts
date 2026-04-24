import { describe, it, expect, mock, spyOn, beforeEach } from 'bun:test';
import { SourceControllerV2 } from './source.controller';
import { sourceServiceV2 } from './source.service';

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

describe('SourceControllerV2', () => {
    beforeEach(() => {
        mock.restore();
    });

    it('create should return 201 on success', async () => {
        const input = { name: 'S1', service: 'stripe' };
        spyOn(sourceServiceV2, 'create').mockResolvedValue({ id: 'src_1' } as any);

        const c = mockContext(input);
        const result: any = await SourceControllerV2.create(c);

        expect(result.status).toBe(201);
        expect(result.data.success).toBe(true);
        expect(result.data.data.id).toBe('src_1');
    });

    it('create should return 500 on unexpected service failure', async () => {
        spyOn(sourceServiceV2, 'create').mockRejectedValue(new Error('Unexpected crash'));

        const c = mockContext({ name: 'S1', service: 'stripe' });
        const result: any = await SourceControllerV2.create(c);

        expect(result.status).toBe(500);
        expect(result.data.success).toBe(false);
        expect(result.data.error.code).toBe('CREATE_SOURCE_FAILED');
    });

    it('list should support pagination', async () => {
        spyOn(sourceServiceV2, 'gets').mockResolvedValue({ sources: [], total: 0 });

        const c = mockContext({}, {}, { limit: '10', page: '1' });
        const result: any = await SourceControllerV2.list(c);

        expect(result.status).toBe(200);
        expect(result.data.data).toEqual([]);
        expect(result.data.pagination.total).toBe(0);
    });

    it('get should return 404 if source not found', async () => {
        spyOn(sourceServiceV2, 'getById').mockResolvedValue(null);

        const c = mockContext({}, { id: 'src_999' });
        const result: any = await SourceControllerV2.get(c);

        expect(result.status).toBe(404);
        expect(result.data.success).toBe(false);
    });

    it('update should return 200 on success', async () => {
        spyOn(sourceServiceV2, 'update').mockResolvedValue({ id: 'src_1', name: 'Updated' } as any);

        const c = mockContext({ name: 'Updated' }, { id: 'src_1' });
        const result: any = await SourceControllerV2.update(c);

        expect(result.status).toBe(200);
        expect(result.data.data.name).toBe('Updated');
    });

    it('delete should return 200 on success', async () => {
        spyOn(sourceServiceV2, 'delete').mockResolvedValue(true);

        const c = mockContext({}, { id: 'src_1' });
        const result: any = await SourceControllerV2.delete(c);

        expect(result.status).toBe(200);
        expect(result.data.success).toBe(true);
    });
});
