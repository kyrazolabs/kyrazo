import { redisConfig } from '@/configs';
import { ISubscription, logger, unprefixId } from '@kyrazo/shared';

export class SubscriptionCacheService {
    private readonly CACHE_TTL = 60 * 60 * 24; // 24 hours

    private getKey(workspaceId: string): string {
        return `workspace:subscription:${unprefixId(workspaceId)}`;
    }

    async get(workspaceId: string): Promise<ISubscription | null> {
        const key = this.getKey(workspaceId);
        try {
            const cached = await redisConfig.get(key);
            if (cached) {
                return JSON.parse(cached);
            }
        } catch (error) {
            logger.error('Error fetching subscription from Redis', error as Error);
        }
        return null;
    }

    async set(workspaceId: string, subscription: ISubscription): Promise<void> {
        const key = this.getKey(workspaceId);
        try {
            await redisConfig.set(key, JSON.stringify(subscription), this.CACHE_TTL);
        } catch (error) {
            logger.error('Error caching subscription to Redis', error as Error);
        }
    }

    async invalidate(workspaceId: string): Promise<void> {
        const key = this.getKey(workspaceId);
        try {
            await redisConfig.del(key);
        } catch (error) {
            logger.error('Error invalidating subscription cache', error as Error);
        }
    }
}

export const subscriptionCacheService = new SubscriptionCacheService();
