import { redisConfig } from '@/configs';
import { ISubscription, logger, unprefixId, RedisKeys } from '@kyrazo/shared';

export class SubscriptionCacheService {
    private readonly CACHE_TTL = 60 * 60 * 24; // 24 hours

    private getKey(workspaceId: string): string {
        return RedisKeys.billing.subscription(workspaceId);
    }

    async get(workspaceId: string): Promise<ISubscription | null> {
        const key = this.getKey(workspaceId);
        try {
            const cached = await redisConfig.get(key);
            if (cached) {
                return JSON.parse(cached);
            }
        } catch (error: any) {
            logger.error('Error fetching subscription from Redis', error);
        }
        return null;
    }

    async set(workspaceId: string, subscription: ISubscription): Promise<void> {
        const key = this.getKey(workspaceId);
        try {
            await redisConfig.set(key, JSON.stringify(subscription), this.CACHE_TTL);
        } catch (error: any) {
            logger.error('Error caching subscription to Redis', error);
        }
    }

    async invalidate(workspaceId: string): Promise<void> {
        const key = this.getKey(workspaceId);
        try {
            await redisConfig.del(key);
        } catch (error: any) {
            logger.error('Error invalidating subscription cache', error);
        }
    }
}

export const subscriptionCacheService = new SubscriptionCacheService();
