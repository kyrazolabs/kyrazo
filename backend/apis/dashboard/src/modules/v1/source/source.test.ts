import { describe, it, expect, mock, spyOn } from 'bun:test';
import { SourceController } from './source.controller';
import { sourceService } from './source.service';
import { sourceRepository } from './source.repo';

describe('SourceService', () => {
    it('getSourceById should strip authentication data', async () => {
        const sourceWithAuth = {
            _id: 's1',
            name: 'Sensitive Source',
            authentication: { type: 'service', credentials: { secret: 'hidden' } },
        };
        spyOn(sourceRepository, 'findById').mockResolvedValue(sourceWithAuth as any);

        const result = await sourceService.getSourceById('s1', 'w1', 'p1');

        expect(result).toHaveProperty('name', 'Sensitive Source');
        expect(result).not.toHaveProperty('authentication');
    });

    it('getSources should strip authentication data from all sources', async () => {
        const sourcesWithAuth = [
            {
                _id: 's1',
                authentication: { secret: 'shh' },
            },
            {
                _id: 's2',
                authentication: { secret: 'quiet' },
            },
        ];
        spyOn(sourceRepository, 'findAll').mockResolvedValue({
            sources: sourcesWithAuth as any,
            total: 2,
        });

        const result = await sourceService.getSources({}, 10, 1);

        expect(result.sources).toHaveLength(2);
        expect(result.sources[0]).not.toHaveProperty('authentication');
        expect(result.sources[1]).not.toHaveProperty('authentication');
    });
});

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
            json: (data: any, status: number = 200) => ({ data, status }),
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

        spyOn(sourceService, 'createSource').mockResolvedValue(savedSource as any);

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

    it('updateSourceAuth should update authentication successfully', async () => {
        spyOn(sourceService, 'updateSourceAuth').mockResolvedValue({
            message: 'Authentication updated successfully',
        });

        const input = {
            authentication: {
                enabled: true,
                type: 'service',
                service: { secret: 'new-secret' },
            },
        };

        const c = mockContext(input, { sourceId: 'source1' });
        const result: any = await SourceController.updateSourceAuth(c);

        expect(result.status).toBe(200); // Wait, controller returns explicit status or default?
        // SourceController.updateSourceAuth uses c.json({...}) which defaults to 200 usually if not specified 2nd arg
        // checking implementation: return c.json({...}) -> status 200
        expect(result.data.success).toBe(true);
        expect(result.data.message).toBe('Source authentication updated successfully.');
    });
});
