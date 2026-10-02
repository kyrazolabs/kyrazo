import { describe, it, expect, mock, beforeEach, spyOn } from 'bun:test';
import { secretCrypto, RedisKeys } from '@kyrazo/shared';

// Mocking dependencies
mock.module('@kyrazo/shared', () => {
    return {
        secretCrypto: {
            encrypt: mock(),
        },
        RedisKeys: {
            context: {
                s3Bucket: mock(id => `context:s3:${id}`),
            },
        },
        logger: {
            error: mock(),
            debug: mock(),
        },
        unprefixId: mock(id => id),
        prefixId: mock((id, prefix) => `${prefix}_${id}`),
        buildS3Config: mock((provider, input) => input),
    };
});

const mockRedis = {
    del: mock().mockResolvedValue(1),
};

mock.module('@/configs', () => {
    return {
        redisConfig: {
            getQueueClient: () => mockRedis,
        },
    };
});

// Mock S3Client from AWS SDK
const mockS3ClientInstance = {
    send: mock(),
};

mock.module('@aws-sdk/client-s3', () => {
    return {
        S3Client: mock().mockImplementation(() => mockS3ClientInstance),
        HeadBucketCommand: class HeadBucketCommand {
            constructor(public input: any) {}
        },
    };
});

describe('S3Service', () => {
    const workspaceId = 'workspace1';
    const namespaceId = 'namespace1';
    const s3Id = 's3b_123';

    let s3Service: any;
    let s3Repo: any;

    beforeEach(async () => {
        mock.restore();
        mockRedis.del.mockClear();
        mockS3ClientInstance.send.mockClear();
        (secretCrypto.encrypt as any).mockClear();

        const serviceModule = await import('./s3.service');
        const S3ServiceClass = serviceModule.S3Service;

        const repoModule = await import('./s3.repo');
        s3Repo = repoModule.s3Repo;

        // Mock startSession
        const mockSession = {
            withTransaction: mock((callback: any) => callback()),
            endSession: mock().mockResolvedValue(undefined),
        };
        spyOn(s3Repo, 'startSession').mockResolvedValue(mockSession as any);

        // Manual instantiation for DI
        s3Service = new S3ServiceClass(
            class {
                constructor() {
                    return mockS3ClientInstance;
                }
                send(command: any) {
                    return mockS3ClientInstance.send(command);
                }
            } as any
        );
    });

    describe('createS3Bucket', () => {
        it('should encrypt secretAccessKey and call repo', async () => {
            const input = {
                name: 'Test',
                bucketName: 'bucket',
                region: 'us-east-1',
                accessKeyId: 'key',
                secretAccessKey: 'plain_secret',
            };

            (secretCrypto.encrypt as any).mockReturnValue({ encrypted: 'enc_secret', iv: 'iv123' });
            const repoSpy = spyOn(s3Repo, 'create').mockResolvedValue({ id: s3Id } as any);

            const result = await s3Service.createS3Bucket(
                input as any,
                'user1',
                workspaceId,
                namespaceId
            );

            expect(secretCrypto.encrypt).toHaveBeenCalledWith(namespaceId, 'plain_secret');
            expect(repoSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    secretAccessKey: 'enc_secret',
                    iv: 'iv123',
                }),
                expect.any(Object)
            );
            expect(result.id).toBe(s3Id);
        });
    });

    describe('updateS3Bucket', () => {
        it('should encrypt secret if provided and invalidate cache', async () => {
            const updateInput = { secretAccessKey: 'new_plain' };
            (secretCrypto.encrypt as any).mockReturnValue({ encrypted: 'new_enc', iv: 'new_iv' });
            spyOn(s3Repo, 'findById').mockResolvedValue({ id: s3Id } as any);
            spyOn(s3Repo, 'update').mockResolvedValue({ id: s3Id } as any);

            await s3Service.updateS3Bucket(
                s3Id,
                workspaceId,
                namespaceId,
                updateInput as any,
                'user1'
            );

            expect(secretCrypto.encrypt).toHaveBeenCalled();
            expect(mockRedis.del).toHaveBeenCalledWith(`context:s3:${s3Id}`);
        });
    });

    describe('testConnection', () => {
        it('should return success if S3 client head bucket passes', async () => {
            mockS3ClientInstance.send.mockResolvedValue({});

            const result = await s3Service.testConnection({
                bucketName: 'test',
                region: 'us-east-1',
                accessKeyId: 'acc',
                secretAccessKey: 'sec',
                provider: 'aws',
                forcePathStyle: false,
            });

            expect(result.success).toBe(true);
            expect(mockS3ClientInstance.send).toHaveBeenCalled();
        });

        it('should return false if S3 client throws error', async () => {
            mockS3ClientInstance.send.mockRejectedValue(new Error('Access Denied'));

            const result = await s3Service.testConnection({
                bucketName: 'test',
                region: 'us-east-1',
                accessKeyId: 'acc',
                secretAccessKey: 'sec',
                provider: 'aws',
                forcePathStyle: false,
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Access Denied');
        });
    });
});
