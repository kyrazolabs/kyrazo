import { redisConfig } from '@/configs/redis';
import { subscriptionRepository } from '@/modules/billing/subscriptions/subscription.repo';
import { IPlanLimits, logger, unprefixId } from '@kyrazo/shared';
import { subscriptionCacheService } from './subscription-cache.service';

export const FREE_PLAN_LIMITS: IPlanLimits = {
    eventsPerSecond: 25,
    eventsPerMonth: 100000,
    maxNamespaces: 3,
    maxMembers: 3,
    maxConnectors: 3,
    maxIntegrations: 1,
    maxWorkers: 0,
};

export class LimitService {
    /**
     * Get workspace limits from cache or DB
     */
    async getWorkspaceLimits(workspaceId?: string): Promise<IPlanLimits> {
        if (!workspaceId) {
            return FREE_PLAN_LIMITS;
        }

        try {
            // Try to get centralized subscription from Redis
            const subscription = await subscriptionCacheService.get(workspaceId);
            if (subscription?.planSnapshot?.limits) {
                return subscription.planSnapshot.limits;
            }
        } catch (error) {
            logger.error('Error fetching cached subscription for limits', error as Error);
        }

        // Fallback to DB
        const subscription = await subscriptionRepository.findActiveByWorkspace(workspaceId);

        let limits: IPlanLimits;
        if (subscription) {
            limits = subscription.planSnapshot.limits;
            // Prime the centralized cache while we're here
            await subscriptionCacheService.set(workspaceId, subscription);
        } else {
            limits = FREE_PLAN_LIMITS;
        }

        return limits;
    }

    /**
     * Invalidate workspace limits cache
     */
    async invalidateWorkspaceLimits(workspaceId: string): Promise<void> {
        await subscriptionCacheService.invalidate(workspaceId);
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
