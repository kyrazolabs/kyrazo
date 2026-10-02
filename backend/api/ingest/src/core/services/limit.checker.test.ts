import { describe, it, expect, beforeEach, afterEach, jest, mock } from 'bun:test';
import { redisConfig } from '@/configs';

// Mock subscriptionRepository before importing LimitChecker
mock.module('../../repositories/subscription.repo', () => ({
    subscriptionRepository: {
        findActiveByWorkspace: mock(),
    },
}));

import { subscriptionRepository } from '../../repositories/subscription.repo';
import { LimitChecker } from './limit.checker';

// Mock Redis Config
mock.module('@/configs', () => ({
    redisConfig: {
        client: {
            get: mock(),
            set: mock(),
        },
    },
    logger: {
        warn: mock(),
        error: mock(),
    },
}));

describe('LimitChecker', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should use cached limits if available', async () => {
        const workspaceId = 'ws-123';
        const cachedLimits = { eventsPerMonth: 1000 };
        (redisConfig.client!.get as jest.Mock).mockResolvedValue(JSON.stringify(cachedLimits));
        (redisConfig.client!.get as jest.Mock).mockResolvedValueOnce(JSON.stringify(cachedLimits)) // user limits
            .mockResolvedValueOnce('500'); // current usage

        const result = await LimitChecker.checkEventLimit(workspaceId);

        expect(result).toBe(true);
        expect(subscriptionRepository.findActiveByWorkspace).not.toHaveBeenCalled();
    });

    it('should fallback to DB if limits not cached', async () => {
        const workspaceId = 'ws-123';
        (redisConfig.client!.get as jest.Mock).mockResolvedValueOnce(null); // cache miss for limits
        (redisConfig.client!.get as jest.Mock).mockResolvedValueOnce('500'); // current usage

        const dbLimits = { eventsPerMonth: 2000 };
        (subscriptionRepository.findActiveByWorkspace as jest.Mock).mockResolvedValue({
            planSnapshot: { limits: dbLimits },
        });

        const result = await LimitChecker.checkEventLimit(workspaceId);

        expect(result).toBe(true);
        expect(subscriptionRepository.findActiveByWorkspace).toHaveBeenCalledWith(workspaceId);
        expect(redisConfig.client!.set).toHaveBeenCalledWith(
            `workspace:limits:${workspaceId}`,
            JSON.stringify(dbLimits),
            'EX',
            expect.any(Number)
        );
    });

    it('should use FREE_PLAN_LIMITS if no subscription found', async () => {
        const workspaceId = 'ws-123';
        (redisConfig.client!.get as jest.Mock).mockResolvedValueOnce(null); // cache miss for limits
        (redisConfig.client!.get as jest.Mock).mockResolvedValueOnce('10'); // current usage (low usage)

        (subscriptionRepository.findActiveByWorkspace as jest.Mock).mockResolvedValue(null);

        const result = await LimitChecker.checkEventLimit(workspaceId);

        expect(result).toBe(true);
        expect(redisConfig.client!.set).toHaveBeenCalledWith(
            `workspace:limits:${workspaceId}`,
            expect.stringContaining('"eventsPerMonth":1000'), // Check for free plan limit
            'EX',
            expect.any(Number)
        );
    });
});
