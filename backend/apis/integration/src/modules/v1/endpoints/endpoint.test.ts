import { describe, it, expect, mock, spyOn } from 'bun:test';
import { EndpointController } from './endpoint.controller';
import { endpointService } from './endpoint.service';
import { Types } from 'mongoose';

describe('EndpointController (Integration)', () => {
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

    it('createEndpoint should create an endpoint successfully', async () => {
        const input = {
            name: 'Test Endpoint',
            url: 'https://example.com',
        };
        const savedEndpoint = {
            ...input,
            _id: 'endpoint1',
            ingressId: 'ingress1',
        };

        spyOn(endpointService, 'createEndpoint').mockResolvedValue(
            savedEndpoint as any
        );

        const c = mockContext(input);
        const result: any = await EndpointController.createEndpoint(c);

        expect(result.status).toBe(201);
        expect(result.data.success).toBe(true);
        expect(result.data.data.endpoint).toEqual(savedEndpoint);
    });

    it('getEndpoints should fetch endpoints', async () => {
        const endpoints = [{ _id: 'endpoint1', name: 'Test' }];
        spyOn(endpointService, 'getEndpoints').mockResolvedValue({
            endpoints,
            total: 1,
        } as any);

        const c = mockContext({}, {}, { limit: 10, page: 1 });
        const result: any = await EndpointController.getEndpoints(c);

        expect(result.status).toBe(200);
        expect(result.data.data).toEqual(endpoints);
        expect(result.data.pagination.total).toBe(1);
    });
});
