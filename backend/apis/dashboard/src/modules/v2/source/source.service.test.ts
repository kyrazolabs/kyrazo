import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { sourceServiceV2 } from './source.service';
import { sourceRepositoryV2 } from './source.repo';
import { transformRepository } from '../transform/transform.repo';

// Mocking dependencies
mock.module('./source.repo', () => ({
    sourceRepositoryV2: {
        startSession: mock().mockResolvedValue({
            withTransaction: mock(cb => cb()),
            endSession: mock(),
        }),
        create: mock().mockImplementation(data => {
            if (data.name === 'FailMe') throw new Error('DB_ERROR');
            return Promise.resolve({ id: 'src_1', ...data });
        }),
        update: mock().mockImplementation((id, wid, nid, data) => {
            if (id === 'src_fail') throw new Error('UPDATE_ERROR');
            return Promise.resolve({ id, ...data });
        }),
        deleteById: mock().mockResolvedValue(true),
        findById: mock().mockImplementation(id => {
            if (id === 'src_none') return Promise.resolve(null);
            return Promise.resolve({ id, transformId: 'tr_1', isManagedTransform: true });
        }),
        findAll: mock().mockResolvedValue({ sources: [], total: 0 }),
    },
}));

mock.module('../transform/transform.repo', () => ({
    transformRepository: {
        create: mock().mockImplementation(data => {
            if (data.name === 'Bad Transform') throw new Error('TRANSFORM_ERROR');
            return Promise.resolve({ id: 'tr_1', ...data });
        }),
        update: mock().mockResolvedValue({ id: 'tr_1' }),
        deleteById: mock().mockResolvedValue(true),
    },
}));

mock.module('@/configs', () => ({
    config: {
        app: {
            ingest: { v1: 'https://api.test/v1/' },
        },
    },
}));

describe('SourceServiceV2 - Comprehensive Tests', () => {
    const userId = 'user_1';
    const workspaceId = 'wrk_1';
    const namespaceId = 'ns_1';

    beforeEach(() => {
        mock.restore();
    });

    describe('create', () => {
        it('should handle repository creation failure', async () => {
            const input: any = { name: 'FailMe', service: 'stripe' };
            try {
                await sourceServiceV2.create(input, userId, workspaceId, namespaceId);
                throw new Error('Should have failed');
            } catch (e: any) {
                expect(e.message).toBe('DB_ERROR');
            }
        });

        it('should handle managed transformer creation failure', async () => {
            const input: any = {
                name: 'Managed Source',
                transformer: { name: 'Bad Transform', code: '...' },
            };
            try {
                await sourceServiceV2.create(input, userId, workspaceId, namespaceId);
                throw new Error('Should have failed');
            } catch (e: any) {
                expect(e.message).toBe('TRANSFORM_ERROR');
            }
        });
    });

    describe('update', () => {
        it('should throw if source not found', async () => {
            try {
                await sourceServiceV2.update(
                    'src_none',
                    workspaceId,
                    namespaceId,
                    { name: 'X' },
                    userId
                );
                throw new Error('Should have failed');
            } catch (e: any) {
                expect(e.message).toBe('Source not found');
            }
        });

        it('should handle update repository failure', async () => {
            try {
                await sourceServiceV2.update(
                    'src_fail',
                    workspaceId,
                    namespaceId,
                    { name: 'X' },
                    userId
                );
                throw new Error('Should have failed');
            } catch (e: any) {
                expect(e.message).toBe('UPDATE_ERROR');
            }
        });

        it('should perform metadata-only update (no transformer in data)', async () => {
            const input: any = { name: 'New Name' };
            await sourceServiceV2.update('src_1', workspaceId, namespaceId, input, userId);
            expect(transformRepository.update).not.toHaveBeenCalled();
            expect(sourceRepositoryV2.update).toHaveBeenCalled();
        });
    });

    describe('delete', () => {
        it('should throw if source not found for deletion', async () => {
            try {
                await sourceServiceV2.delete('src_none', workspaceId, namespaceId);
                throw new Error('Should have failed');
            } catch (e: any) {
                expect(e.message).toBe('Source not found');
            }
        });

        it('should delete source but skip transformer cleanup if not managed', async () => {
            (sourceRepositoryV2.findById as any).mockResolvedValueOnce({
                id: 'src_1',
                transformId: 'tr_1',
                isManagedTransform: false,
            });
            await sourceServiceV2.delete('src_1', workspaceId, namespaceId);
            expect(transformRepository.deleteById).not.toHaveBeenCalled();
            expect(sourceRepositoryV2.deleteById).toHaveBeenCalled();
        });
    });

    describe('gets', () => {
        it('should apply search filters correctly', async () => {
            const options = { q: 'stripe', status: 'active' as any, limit: 10, page: 1 };
            await sourceServiceV2.gets(workspaceId, namespaceId, options);
            expect(sourceRepositoryV2.findAll).toHaveBeenCalledWith(
                workspaceId,
                namespaceId,
                expect.anything()
            );
        });
    });
});
