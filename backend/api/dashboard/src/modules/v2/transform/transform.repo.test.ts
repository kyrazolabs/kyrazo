import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { Transform, TransformVersion } from '@kyrazo/shared';

// Mocking Mongoose models
const mockSave = mock().mockResolvedValue({
    _id: 'raw_1',
    toJSON: () => ({ _id: 'raw_1', code: 'test' }),
});
const mockSession = {
    withTransaction: mock(cb => cb()),
    endSession: mock(),
};

class MockDocument {
    _id = 'raw_1';
    currentVersion = 1;
    code = 'test';
    save = mockSave;
    toJSON = () => ({ _id: 'raw_1', code: 'test' });
}

const mockDoc = new MockDocument();

// Mock constructor
const MockTransform = function (data: any) {
    return Object.assign(new MockDocument(), data);
} as any;

const MockTransformVersion = function (data: any) {
    return Object.assign(new MockDocument(), data);
} as any;

mock.module('@kyrazo/shared', () => {
    const original = require('@kyrazo/shared');
    return {
        ...original,
        Transform: Object.assign(MockTransform, {
            startSession: mock().mockResolvedValue(mockSession),
            findOne: mock().mockReturnValue({
                session: mock().mockReturnThis(),
                lean: mock().mockResolvedValue(mockDoc),
                then: (cb: any) => cb(mockDoc),
            }),
            find: mock().mockReturnValue({
                sort: mock().mockReturnThis(),
                skip: mock().mockReturnThis(),
                limit: mock().mockReturnThis(),
                lean: mock().mockResolvedValue([mockDoc]),
            }),
            findOneAndUpdate: mock().mockReturnValue({
                lean: mock().mockResolvedValue(mockDoc),
            }),
            findOneAndDelete: mock().mockReturnValue({
                lean: mock().mockResolvedValue(mockDoc),
            }),
            countDocuments: mock().mockResolvedValue(0),
        }),
        TransformVersion: Object.assign(MockTransformVersion, {
            findOne: mock().mockReturnValue({
                session: mock().mockReturnThis(),
                lean: mock().mockResolvedValue(mockDoc),
                then: (cb: any) => cb(mockDoc),
            }),
            find: mock().mockReturnValue({
                sort: mock().mockReturnThis(),
                lean: mock().mockResolvedValue([]),
            }),
            deleteMany: mock().mockResolvedValue({ deletedCount: 1 }),
        }),
        unprefixId: (id: string) => id.split('_')[1] || id,
        RedisKeys: {
            context: {
                activeTransform: mock((w, n) => `context:tr:${w}:${n}`),
            },
        },
    };
});

mock.module('@/configs', () => {
    return {
        redisConfig: {
            getClient: () => ({
                del: mock().mockResolvedValue(1),
            }),
            del: mock().mockResolvedValue(1),
        },
    };
});

describe('TransformRepository', () => {
    const workspaceId = 'w_123';
    const namespaceId = 'n_123';
    const transformId = 'tr_123';

    let transformRepository: any;

    beforeEach(async () => {
        mock.restore();
        mockSave.mockClear();
        mockSession.withTransaction.mockClear();
        const module = await import('./transform.repo');
        transformRepository = module.transformRepository;
    });

    it('should create a transform and a version entry', async () => {
        await transformRepository.create(
            {
                name: 'T',
                code: 'test',
                workspaceId: workspaceId as any,
                namespaceId: namespaceId as any,
            },
            'user1'
        );

        expect(mockSave).toHaveBeenCalled();
        expect(mockSession.withTransaction).toHaveBeenCalled();
    });

    it('should rollback to specified version', async () => {
        await transformRepository.rollback(transformId, workspaceId, namespaceId, 2, 'user1');

        expect(mockSave).toHaveBeenCalled();
    });

    it('should delete transform and all its versions', async () => {
        await transformRepository.deleteById(transformId, workspaceId, namespaceId);

        expect(Transform.findOneAndUpdate).toHaveBeenCalled();
    });
});
