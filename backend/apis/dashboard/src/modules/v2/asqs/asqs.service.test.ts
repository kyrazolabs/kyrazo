import { describe, it, expect, mock, beforeEach, spyOn } from 'bun:test';
import { asqsService } from './asqs.service';
import { asqsRepo } from './asqs.repo';
import { secretCrypto, RedisKeys } from '@kyrazo/shared';
import { redisConfig } from '@/configs';

// Mocking dependencies
mock.module('@kyrazo/shared', () => {
    return {
        secretCrypto: {
            encrypt: mock(),
        },
        RedisKeys: {
            context: {
                asqs: mock((id) => `context:sqs:${id}`),
            },
        },
        logger: {
            error: mock(),
            debug: mock(),
        },
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

// Mock SQS SDK
const mockSQSInstance = {
    send: mock(),
};

mock.module('@aws-sdk/client-sqs', () => {
    return {
        SQSClient: function() { return mockSQSInstance; },
        SendMessageCommand: class {
            constructor(params: any) { (this as any).params = params; }
        },
    };
});

describe('ASQSService', () => {
    const workspaceId = 'workspace1';
    const namespaceId = 'namespace1';
    const asqsId = 'sqs_123';

    beforeEach(() => {
        mock.restore();
        // Mock startSession
        const mockSession = {
            withTransaction: mock((callback: any) => callback()),
            endSession: mock().mockResolvedValue(undefined),
        };
        spyOn(asqsRepo, 'startSession').mockResolvedValue(mockSession as any);
    });

    describe('createASQS', () => {
        it('should encrypt secret and call repo', async () => {
            const input = {
                name: 'Test',
                queueUrl: 'url',
                region: 'us-east-1',
                accessKeyId: 'key',
                secretAccessKey: 'plain',
            };

            (secretCrypto.encrypt as any).mockReturnValue({ encrypted: 'encrypted', iv: 'iv' });
            const repoSpy = spyOn(asqsRepo, 'create').mockResolvedValue({ id: asqsId } as any);

            await asqsService.createASQS(input as any, 'user1', workspaceId, namespaceId);

            expect(secretCrypto.encrypt).toHaveBeenCalled();
            expect(repoSpy).toHaveBeenCalled();
        });
    });

    describe('testConnection', () => {
        it('should return success if SQS send succeeds', async () => {
            mockSQSInstance.send.mockResolvedValue({ MessageId: 'msg123' });

            const result = await asqsService.testConnection({
                queueUrl: 'url',
                region: 'us-east-1',
                accessKeyId: 'acc',
                secretAccessKey: 'sec'
            });

            expect(result.success).toBe(true);
        });

        it('should return false if SQS send throws error', async () => {
            mockSQSInstance.send.mockRejectedValue(new Error('Queue Does Not Exist'));

            const result = await asqsService.testConnection({
                queueUrl: 'url',
                region: 'us-east-1',
                accessKeyId: 'acc',
                secretAccessKey: 'sec'
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Queue Does Not Exist');
        });
    });

    describe('cache invalidation', () => {
        it('should invalidate cache on delete', async () => {
            mockRedis.del.mockClear();
            spyOn(asqsRepo, 'delete').mockResolvedValue({ id: asqsId } as any);

            await asqsService.deleteASQS(asqsId, workspaceId, namespaceId);

            expect(mockRedis.del).toHaveBeenCalledWith(`context:sqs:${asqsId}`);
        });
    });
});
