import { describe, it, expect, mock, spyOn, beforeEach } from 'bun:test';
import { ASQSController } from './asqs.controller';
import { asqsService } from './asqs.service';

const mockContext = (
    body: any = {},
    params: any = {},
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
                return {};
            },
            param: () => params,
        },
        json: (data: any, status: number = 200) => ({ data, status }),
        get: (key: string) => key,
    } as any;
};

describe('ASQSController', () => {
    beforeEach(() => {
        mock.restore();
    });

    it('createASQS should return success response', async () => {
        const input = { name: 'SQS Dest' };
        spyOn(asqsService, 'createASQS').mockResolvedValue({ id: 'sqs_1' } as any);

        const c = mockContext(input);
        const result: any = await ASQSController.createASQS(c);

        expect(result.status).toBe(200);
        expect(result.data.message).toContain('created');
        expect(result.data.data.id).toBe('sqs_1');
    });

    it('getASQSs should list all destinations', async () => {
        spyOn(asqsService, 'listASQS').mockResolvedValue([{ id: 'sqs_1' }, { id: 'sqs_2' }] as any);

        const c = mockContext();
        const result: any = await ASQSController.getASQSs(c);

        expect(result.status).toBe(200);
        expect(result.data.data).toHaveLength(2);
    });

    it('updateASQS should return 404 if not found', async () => {
        spyOn(asqsService, 'updateASQS').mockResolvedValue(null);

        const c = mockContext({ name: 'New' }, { id: 'sqs_999' });
        const result: any = await ASQSController.updateASQS(c);

        expect(result.status).toBe(404);
        expect(result.data.success).toBe(false);
    });

    it('testConnection should proxy service results', async () => {
        spyOn(asqsService, 'testConnection').mockResolvedValue({ success: true });

        const c = mockContext({ queueUrl: 'http://test' });
        const result: any = await ASQSController.testConnection(c);

        expect(result.status).toBe(200);
        expect(result.data.success).toBe(true);
    });
});
