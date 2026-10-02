import { describe, it, expect, mock, spyOn, beforeEach } from 'bun:test';
import { S3Controller } from './s3.controller';
import { s3Service } from './s3.service';

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

describe('S3Controller', () => {
    beforeEach(() => {
        mock.restore();
    });

    it('createS3Bucket should return 200 on success', async () => {
        const input = { name: 'Test' };
        spyOn(s3Service, 'createS3Bucket').mockResolvedValue({ id: 's3b_1' } as any);

        const c = mockContext(input);
        const result: any = await S3Controller.createS3Bucket(c);

        expect(result.status).toBe(200);
        expect(result.data.success).toBe(true);
        expect(result.data.data.id).toBe('s3b_1');
    });

    it('getS3Buckets should list all buckets', async () => {
        spyOn(s3Service, 'listS3Buckets').mockResolvedValue([{ id: 's3b_1' }] as any);

        const c = mockContext();
        const result: any = await S3Controller.getS3Buckets(c);

        expect(result.status).toBe(200);
        expect(result.data.data).toHaveLength(1);
    });

    it('getS3Bucket should return 404 if not found', async () => {
        spyOn(s3Service, 'getS3Bucket').mockResolvedValue(null);

        const c = mockContext({}, { id: 's3b_999' });
        const result: any = await S3Controller.getS3Bucket(c);

        expect(result.status).toBe(404);
        expect(result.data.success).toBe(false);
    });

    it('testConnection should return 400 on failure', async () => {
        spyOn(s3Service, 'testConnection').mockResolvedValue({ success: false, error: 'Wrong Credentials' });

        const c = mockContext({ bucketName: 'wrong' });
        const result: any = await S3Controller.testConnection(c);

        expect(result.status).toBe(400);
        expect(result.data.success).toBe(false);
        expect(result.data.error).toBe('Wrong Credentials');
    });
    
    it('should return 401 if context is missing', async () => {
        const c = mockContext();
        delete c.workspace; // Simulate unauthorized
        
        const result: any = await S3Controller.getS3Buckets(c);
        expect(result.status).toBe(401);
    });
});
