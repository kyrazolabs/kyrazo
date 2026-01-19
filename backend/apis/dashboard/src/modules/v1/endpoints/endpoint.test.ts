import { describe, it, expect, mock, spyOn } from 'bun:test';
import { EndpointController } from './endpoint.controller';
import { endpointService } from './endpoint.service';
import { Types } from 'mongoose';

describe('EndpointController', () => {
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

    it('getEndpoint should fetch an endpoint', async () => {
        const endpoint = { _id: 'endpoint1', name: 'Test' };
        spyOn(endpointService, 'getEndpointById').mockResolvedValue(
            endpoint as any
        );

        const c = mockContext({}, { endpointId: 'endpoint1' });
        const result: any = await EndpointController.getEndpoint(c);

        expect(result.status).toBe(200);
        expect(result.data.data).toEqual(endpoint);
    });
});
