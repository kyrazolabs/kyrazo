import { describe, it, expect, mock, spyOn } from 'bun:test';
import { SourceController } from './source.controller';
import { sourceService } from './source.service';

describe('SourceController', () => {
    const mockContext = (
        body: any = {},
        params: any = {},
        query: any = {},
        userId: string = 'user1',
        workspaceId: string = 'workspace1',
        projectId: string = 'project1'
    ) => {
        return {
            user: { userId },
            workspace: { workspaceId },
            project: { projectId },
            req: {
                valid: (type: string) => {
                    if (type === 'json') return body;
                    if (type === 'param') return params;
                    if (type === 'query') return query;
                    return {};
                },
            },
            json: (data: any, status: number) => ({ data, status }),
            get: (key: string) => key,
        } as any;
    };

    it('createSource should create a source successfully', async () => {
        const input = {
            name: 'Test Source',
            type: 'receive',
            service: 'stripe',
            authentication: {
                enabled: true,
                type: 'service',
                service: { secret: 'shhh' },
            },
        };
        const savedSource = {
            ...input,
            _id: 'source1',
            ingressId: 'ingress1',
            authentication: {
                ...input.authentication,
                credentials: { secret: 'encrypted' },
            },
        };

        spyOn(sourceService, 'createSource').mockResolvedValue(
            savedSource as any
        );

        const c = mockContext(input);
        const result: any = await SourceController.createSource(c);

        expect(result.status).toBe(201);
        expect(result.data.success).toBe(true);
        expect(result.data.data.sourceId).toBe('source1');
    });

    it('getSource should fetch a source', async () => {
        const source = { _id: 'source1', name: 'Test' };
        spyOn(sourceService, 'getSourceById').mockResolvedValue(source as any);

        const c = mockContext({}, { sourceId: 'source1' });
        const result: any = await SourceController.getSource(c);

        expect(result.status).toBe(200);
        expect(result.data.data).toEqual(source);
    });
});
