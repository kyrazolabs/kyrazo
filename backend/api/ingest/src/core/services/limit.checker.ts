import { redisConfig } from '@/configs';

import { subscriptionRepository } from '../../repositories/subscription.repo';
import { logger, unprefixId, RedisKeys } from '@kyrazo/shared';

const FREE_PLAN_LIMITS = {
    eventsPerSecond: 10,
    eventsPerMonth: 1000,
    maxNamespaces: 1,
    maxMembers: 1,
    maxConnectors: 1,
    maxIntegrations: 1,
    maxWorkers: 1,
};

export class LimitChecker {
    static async getWorkspaceSub(workspaceId: string) {
        return await redisConfig.cache(
            RedisKeys.billing.workspacePlan(workspaceId),
            async () => {
                const subscription = await subscriptionRepository.findActiveByWorkspace(
                    unprefixId(workspaceId)!
                );
                const subs = {
                    ...(subscription
                        ? {
                              ...subscription.planSnapshot.limits,
                              ingest: subscription.planSnapshot.features.ingest,
                          }
                        : {
                              ...FREE_PLAN_LIMITS,
                              ingest: false, // Free plan might not have ingest enabled by default if configured so
                          }),
                    subId: subscription?._id,
                    planSlug: subscription ? subscription?.planSnapshot.slug : 'free',
                };
                return subs;
            },
            60 * 60 * 24 // 24 hours
        );
    }

    static async checkEventLimit(workspaceId: string): Promise<boolean> {
        try {
            const limits = await this.getWorkspaceSub(workspaceId);

            // Check if ingest is enabled for this plan
            if (limits.ingest === false) {
                logger.warn(
                    `Workspace ${workspaceId} tried to ingest an event but ingest is disabled in their plan.`
                );
                return false;
            }

            const limit = limits.eventsPerMonth;

            if (limit === -1) return true; // Unlimited

            // 2. Get current usage from Redis
            const date = new Date();
            const currentMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const redisKey = RedisKeys.usage.eventCount(workspaceId, currentMonth);

            const usageStr = await redisConfig.client!.get(redisKey);
            const usage = usageStr ? parseInt(usageStr, 10) : 0;

            if (usage >= limit) {
                // Soft limit: Log warning but allow event (for overage billing)
                logger.warn(
                    `Workspace ${workspaceId} exceeded event limit (Soft Limit): ${usage} >= ${limit}`
                );
                return true;
            }

            return true;
        } catch (error: any) {
            logger.error('Error checking event limit:', error);
            return true; // Fail open
        }
    }
}
