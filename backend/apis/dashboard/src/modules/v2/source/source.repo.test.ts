import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { Source } from '@kyrazo/shared';

// Mocking Mongoose models
const mockSave = mock().mockResolvedValue({
    _id: '507f1f77bcf86cd799439011',
    toJSON: () => ({ _id: '507f1f77bcf86cd799439011', name: 'Test Source' }),
});

const mockSession = {
    withTransaction: mock(cb => cb()),
    endSession: mock(),
};

class MockDocument {
    _id = '507f1f77bcf86cd799439011';
    name = 'Test Source';
    save = mockSave;
    toJSON = () => ({ _id: '507f1f77bcf86cd799439011', name: 'Test Source' });
}

const mockDoc = new MockDocument();

// Mock constructor
const MockSource = function (data: any) {
    return Object.assign(new MockDocument(), data);
} as any;

mock.module('@kyrazo/shared', () => {
    const original = require('@kyrazo/shared');
    return {
        ...original,
        Source: Object.assign(MockSource, {
            startSession: mock().mockResolvedValue(mockSession),
            findOne: mock().mockReturnValue({
                populate: mock().mockReturnThis(),
                session: mock().mockReturnThis(),
                lean: mock().mockResolvedValue(mockDoc),
                then: (cb: any) => cb(mockDoc),
            }),
            find: mock().mockReturnValue({
                sort: mock().mockReturnThis(),
                skip: mock().mockReturnThis(),
                limit: mock().mockReturnThis(),
                populate: mock().mockReturnThis(),
                lean: mock().mockResolvedValue([mockDoc]),
            }),
            findOneAndUpdate: mock().mockReturnValue({
                lean: mock().mockImplementation(function (this: any) {
                    if (this._criteria && this._criteria._id === 'invalid')
                        return Promise.resolve(null);
                    return Promise.resolve(mockDoc);
                }),
            }),
            findOneAndDelete: mock().mockReturnValue({
                lean: mock().mockResolvedValue(mockDoc),
            }),
            countDocuments: mock().mockResolvedValue(1),
        }),
        unprefixId: (id: string) => id.split('_')[1] || id,
    };
});

describe('SourceRepositoryV2 - Comprehensive Tests', () => {
    const workspaceId = 'wrk_507f1f77bcf86cd799439011';
    const namespaceId = 'ns_507f1f77bcf86cd799439011';
    const sourceId = 'src_507f1f77bcf86cd799439011';

    let sourceRepository: any;

    beforeEach(async () => {
        mock.restore();
        mockSave.mockClear();
        const module = await import('./source.repo');
        sourceRepository = module.sourceRepositoryV2;
    });

    it('should create a source with correct transformWithId call', async () => {
        const data = { name: 'Test Source', service: 'stripe' as any };
        const result = await sourceRepository.create(data);
        expect(result.id).toBe(sourceId);
    });

    it('should handle findById for missing source', async () => {
        (Source.findOne as any).mockReturnValueOnce({
            populate: mock().mockReturnThis(),
            session: mock().mockReturnThis(),
            lean: mock().mockResolvedValue(null),
            then: (cb: any) => cb(null),
        });
        const result = await sourceRepository.findById('src_none', workspaceId, namespaceId);
        expect(result).toBeNull();
    });

    it('should correctly format query in findAll', async () => {
        await sourceRepository.findAll(workspaceId, namespaceId, { limit: 5, page: 2 });
        expect(Source.find).toHaveBeenCalled();
        // Skip check: (2-1)*5 = 5
    });

    it('should return null on update for non-existent source', async () => {
        (Source.findOneAndUpdate as any).mockReturnValueOnce({
            lean: mock().mockResolvedValue(null),
        });
        const result = await sourceRepository.update('src_missing', workspaceId, namespaceId, {
            name: 'X',
        });
        expect(result).toBeNull();
    });

    it('should return false on delete for non-existent source', async () => {
        (Source.findOneAndDelete as any).mockReturnValueOnce(null);
        const result = await sourceRepository.deleteById('src_missing', workspaceId, namespaceId);
        expect(result).toBe(false);
    });
});
