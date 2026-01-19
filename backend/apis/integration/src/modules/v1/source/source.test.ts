import { describe, it, expect, mock, spyOn } from 'bun:test';
import { SourceController } from './source.controller';
import { sourceService } from './source.service';
import { Types } from 'mongoose';

describe('SourceController (Integration)', () => {
    const mockContext = (
        body: any = {},
        params: any = {},
        query: any = {},
        userId: string = '507f1f77bcf86cd799439011',
        workspaceId: string = '507f1f77bcf86cd799439012',
        projectId: string = '507f1f77bcf86cd799439013'
    ) => {
        return {
            userId: userId,
            workspace: { workspaceId: new Types.ObjectId(workspaceId) },
            project: { projectId: new Types.ObjectId(projectId) },
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

    it('getSources should fetch sources', async () => {
        const sources = [{ _id: 'source1', name: 'Test' }];
        spyOn(sourceService, 'getSources').mockResolvedValue({
            sources,
            total: 1,
        } as any);

        const c = mockContext({}, {}, { limit: 10, page: 1 });
        const result: any = await SourceController.getSources(c);

        expect(result.status).toBe(200);
        expect(result.data.sources).toEqual(sources);
        expect(result.data.total).toBe(1);
    });
});
