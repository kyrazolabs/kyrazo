import { redisConfig } from '@/configs/redis';
import { subscriptionRepository } from '@/modules/billing/subscriptions/subscription.repo';
import { IPlanLimits, logger, unprefixId } from '@kyrazo/shared';

export const FREE_PLAN_LIMITS: IPlanLimits = {
    eventsPerSecond: 25,
    eventsPerMonth: 100000,
    maxProjects: 3,
    maxMembers: 3,
    maxConnectors: 3,
    maxIntegrations: 1,
    maxConcurrent: 0,
};

export class LimitService {
    private readonly LIMITS_TTL = 60 * 60 * 24; // 24 hours

    private getLimitsKey(workspaceId: string): string {
        return `workspace:limits:${unprefixId(workspaceId)}`;
    }

    /**
     * Get workspace limits from cache or DB
     */
    async getWorkspaceLimits(workspaceId?: string): Promise<IPlanLimits> {
        if (!workspaceId) {
            return FREE_PLAN_LIMITS;
        }

        const key = this.getLimitsKey(workspaceId);

        try {
            // Try to get from Redis
            const cached = await redisConfig.get(key);
            if (cached) {
                return JSON.parse(cached);
            }
        } catch (error) {
            logger.error('Error fetching limits from Redis', error as Error);
        }

        // Fallback to DB
        const subscription = await subscriptionRepository.findActiveByWorkspace(workspaceId);

        let limits: IPlanLimits;
        if (subscription) {
            limits = subscription.planSnapshot.limits;
        } else {
            limits = FREE_PLAN_LIMITS;
        }

        // Cache the result
        try {
            await redisConfig.set(key, JSON.stringify(limits), this.LIMITS_TTL);
        } catch (error) {
            logger.error('Error caching limits to Redis', error as Error);
        }

        return limits;
    }

    /**
     * Invalidate workspace limits cache
     */
    async invalidateWorkspaceLimits(workspaceId: string): Promise<void> {
        const key = this.getLimitsKey(workspaceId);
        try {
            await redisConfig.del(key);
        } catch (error) {
            logger.error('Error invalidating limits cache', error as Error);
        }
    }

    /**
     * Check if a specific limit is reached
     */
    async checkLimit(
        workspaceId: string,
        limitKey: keyof IPlanLimits,
        currentCount: number
    ): Promise<boolean> {
        const limits = await this.getWorkspaceLimits(workspaceId);
        const limit = limits[limitKey];

        // If limit is -1 or similar (unlimited), handle accordingly.
        // Assuming strictly positive numbers for now based on schema.

        return currentCount < limit;
    }
    async checkEventLimit(workspaceId: string): Promise<boolean> {
        const limits = await this.getWorkspaceLimits(workspaceId);
        const limit = limits.eventsPerMonth;

        if (limit === -1) return true; // Unlimited

        const date = new Date();
        const currentMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const redisKey = `usage:events:${unprefixId(workspaceId)}:${currentMonth}`;

        const client = redisConfig.getClient();
        const usageStr = await client.get(redisKey);
        const usage = usageStr ? parseInt(usageStr, 10) : 0;

        return usage < limit;
    }
}

export const limitService = new LimitService();
