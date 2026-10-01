import { redisConfig } from '@/configs';

import { subscriptionRepository } from '../../repositories/subscription.repo';
import { logger, FREE_PLAN_LIMITS, RedisKeys } from '@kyrazo/shared';

export class LimitChecker {
    static async getWorkspaceSub(workspaceId: string) {
        return await redisConfig.cache(
            RedisKeys.billing.workspacePlan(workspaceId),
            async () => {
                const subscription =
                    await subscriptionRepository.findActiveByWorkspace(workspaceId);
                const subs = {
                    ...(subscription
                        ? {
                              ...subscription.planSnapshot.limits,
                              dispatch: subscription.planSnapshot.features.dispatch,
                          }
                        : {
                              ...FREE_PLAN_LIMITS,
                              dispatch: false,
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

            // Check if dispatch is enabled for this plan
            if (limits.dispatch === false) {
                logger.warn(
                    `Workspace ${workspaceId} tried to dispatch an event but dispatch is disabled in their plan.`
                );
                return false;
            }

            const limit = limits.eventsPerMonth;

            if (limit === -1) return true; // Unlimited

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
