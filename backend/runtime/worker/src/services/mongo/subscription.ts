import { redisConfig } from "@/config";
import type { ISubscription } from "@kyrazo/shared";
import { Subscription, DEFAULT_FREE_SUBSCRIPTION, RedisKeys, unprefixId } from "@kyrazo/shared";

export class SubscriptionService {
    static async getSubscription(
        workspaceId: string,
    ): Promise<ISubscription | null> {
        // Check cache first
        const subscription = await redisConfig.cache(
            RedisKeys.billing.subscription(workspaceId),
            async () => {
                const sub = await Subscription.findActiveByWorkspace(unprefixId(workspaceId)!);
                return sub || DEFAULT_FREE_SUBSCRIPTION;
            },
            60 * 60 * 24,
        );
        return subscription;
    }
}
