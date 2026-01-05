import { redisConfig } from "@/config";
import type { ISubscription } from "@kyrazo/shared";
import { Subscription } from "@kyrazo/shared";

export class SubscriptionService {
    static async getSubscription(
        workspaceId: string,
    ): Promise<ISubscription | null> {
        // Check cache first
        const subscription = await redisConfig.cache(
            `workspace:subscription:${workspaceId}`,
            async () => {
                return await Subscription.findActiveByWorkspace(workspaceId);
            },
            60 * 60 * 24,
        );
        return subscription;
    }
}
