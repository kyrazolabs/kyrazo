import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { asqsRepo } from './asqs.repo';
import { ASQS, unprefixId } from '@kyrazo/shared';

// Mocking Mongoose model
mock.module('@kyrazo/shared', () => {
    const original = require('@kyrazo/shared');
    return {
        ...original,
        ASQS: Object.assign(
            mock().mockImplementation((data) => ({
                ...data,
                save: mock().mockImplementation(function(this: any) {
                    return Promise.resolve({
                        toJSON: () => ({ ...this, _id: '65c3f1e5f1e5f1e5f1e5f1e7' })
                    });
                }),
            })),
            {
                create: mock(),
                findOne: mock(),
                find: mock(),
                findOneAndUpdate: mock(),
                findOneAndDelete: mock(),
            }
        ),
        unprefixId: (id: string) => id.split('_')[1] || id,
    };
});

describe('ASQSRepo', () => {
    const workspaceId = 'w_65c3f1e5f1e5f1e5f1e5f1e5';
    const namespaceId = 'n_65c3f1e5f1e5f1e5f1e5f1e6';
    const asqsId = 'sqs_65c3f1e5f1e5f1e5f1e5f1e7';

    beforeEach(() => {
        mock.restore();
    });

    describe('create', () => {
        it('should call ASQS.create with correct unprefixed IDs', async () => {
            const data = {
                name: 'Test SQS',
                queueUrl: 'https://sqs.url',
                region: 'us-east-1',
                accessKeyId: 'key123',
                secretAccessKey: 'secret123',
                workspaceId,
                namespaceId,
                iv: 'iv123'
            };

            await asqsRepo.create(data as any);

            expect(ASQS).toHaveBeenCalledWith(expect.objectContaining({
                workspaceId: '65c3f1e5f1e5f1e5f1e5f1e5',
                namespaceId: '65c3f1e5f1e5f1e5f1e5f1e6',
            }));
        });
    });

    it('should find by ID with secrets if requested', async () => {
        const mockQuery = {
            select: mock().mockReturnThis(),
            lean: mock().mockResolvedValue({ name: 'Found' }),
        };
        (ASQS.findOne as any).mockReturnValue(mockQuery);

        await asqsRepo.findById(asqsId, workspaceId, namespaceId, true);

        expect(mockQuery.select).toHaveBeenCalledWith('+secretAccessKey +iv');
    });

    it('should update specific document', async () => {
        (ASQS.findOneAndUpdate as any).mockReturnValue({
            lean: mock().mockResolvedValue({ id: asqsId }),
        });

        await asqsRepo.update(asqsId, workspaceId, namespaceId, { name: 'Updated' });

        expect(ASQS.findOneAndUpdate).toHaveBeenCalledWith(
            expect.objectContaining({ _id: '65c3f1e5f1e5f1e5f1e5f1e7' }),
            expect.any(Object),
            { new: true }
        );
    });
});
