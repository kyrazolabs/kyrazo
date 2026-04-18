import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { s3Repo } from './s3.repo';
import { S3Bucket, unprefixId } from '@kyrazo/shared';

// Mocking Mongoose model
mock.module('@kyrazo/shared', () => {
    const original = require('@kyrazo/shared');
    return {
        ...original,
        S3Bucket: {
            create: mock(),
            findOne: mock(),
            find: mock(),
            findOneAndUpdate: mock(),
            findOneAndDelete: mock(),
        },
        unprefixId: (id: string) => id.split('_')[1] || id,
    };
});

describe('S3Repo', () => {
    const workspaceId = 'w_65c3f1e5f1e5f1e5f1e5f1e5';
    const namespaceId = 'n_65c3f1e5f1e5f1e5f1e5f1e6';
    const s3Id = 's3b_65c3f1e5f1e5f1e5f1e5f1e7';

    beforeEach(() => {
        mock.restore();
    });

    describe('create', () => {
        it('should call S3Bucket.create with correct unprefixed IDs', async () => {
            const data = {
                name: 'Test S3',
                bucketName: 'kyrazo-test',
                region: 'us-east-1',
                accessKeyId: 'key123',
                secretAccessKey: 'secret123',
                workspaceId,
                namespaceId,
                iv: 'iv123'
            };

            await s3Repo.create(data as any);

            expect(S3Bucket.create).toHaveBeenCalledWith(expect.objectContaining({
                workspaceId: '65c3f1e5f1e5f1e5f1e5f1e5',
                namespaceId: '65c3f1e5f1e5f1e5f1e5f1e6',
            }));
        });
    });

    describe('findById', () => {
        it('should find bucket by workspace, namespace and id', async () => {
            const mockQuery = {
                select: mock().mockReturnThis(),
                lean: mock().mockResolvedValue({ name: 'Found' }),
            };
            (S3Bucket.findOne as any).mockReturnValue(mockQuery);

            const result = await s3Repo.findById(s3Id, workspaceId, namespaceId);

            expect(S3Bucket.findOne).toHaveBeenCalledWith({
                _id: '65c3f1e5f1e5f1e5f1e5f1e7',
                workspaceId: '65c3f1e5f1e5f1e5f1e5f1e5',
                namespaceId: '65c3f1e5f1e5f1e5f1e5f1e6',
            });
            expect(result).toEqual({ name: 'Found' });
        });

        it('should include secrets if requested', async () => {
            const mockQuery = {
                select: mock().mockReturnThis(),
                lean: mock().mockResolvedValue({ secretAccessKey: 'hidden' }),
            };
            (S3Bucket.findOne as any).mockReturnValue(mockQuery);

            await s3Repo.findById(s3Id, workspaceId, namespaceId, true);

            expect(mockQuery.select).toHaveBeenCalledWith('+secretAccessKey +iv');
        });
    });

    describe('findByNamespace', () => {
        it('should list all buckets for a namespace', async () => {
            (S3Bucket.find as any).mockReturnValue({
                lean: mock().mockResolvedValue([{ name: 'Bucket 1' }]),
            });

            const result = await s3Repo.findByNamespace(workspaceId, namespaceId);

            expect(S3Bucket.find).toHaveBeenCalledWith({
                workspaceId: '65c3f1e5f1e5f1e5f1e5f1e5',
                namespaceId: '65c3f1e5f1e5f1e5f1e5f1e6',
            });
            expect(result).toHaveLength(1);
        });
    });

    describe('update', () => {
        it('should update and return new document', async () => {
            (S3Bucket.findOneAndUpdate as any).mockReturnValue({
                lean: mock().mockResolvedValue({ name: 'Updated' }),
            });

            const result = await s3Repo.update(s3Id, workspaceId, namespaceId, { name: 'New Name' });

            expect(S3Bucket.findOneAndUpdate).toHaveBeenCalledWith(
                expect.any(Object),
                expect.objectContaining({ name: 'New Name' }),
                { new: true }
            );
            expect(result).toEqual({ name: 'Updated' });
        });
    });

    describe('delete', () => {
        it('should delete document if it belongs to workspace/namespace', async () => {
            (S3Bucket.findOneAndDelete as any).mockReturnValue({
                lean: mock().mockResolvedValue({ id: s3Id }),
            });

            const result = await s3Repo.delete(s3Id, workspaceId, namespaceId);

            expect(S3Bucket.findOneAndDelete).toHaveBeenCalledWith({
                _id: '65c3f1e5f1e5f1e5f1e5f1e7',
                workspaceId: '65c3f1e5f1e5f1e5f1e5f1e5',
                namespaceId: '65c3f1e5f1e5f1e5f1e5f1e6',
            });
            expect(result?.id).toBe(s3Id);
        });
    });
});
