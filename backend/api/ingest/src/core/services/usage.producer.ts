import { Queue } from 'bullmq';
import { bullmqConfig } from '@/configs/bullmq';
import { redisConfig } from '@/configs';
import { Subscription, Customer } from '@kyrazo/shared';
import { logger } from '@kyrazo/shared';

const USAGE_QUEUE_NAME = 'usage-tracking';

export class UsageProducer {
    private queue: Queue;

    constructor() {
        this.queue = new Queue(USAGE_QUEUE_NAME, {
            connection: bullmqConfig.redisClient,
        });
    }

    async trackEvent(
        workspaceId: string,
        subscriptionId: string | undefined,
        eventType: string,
        count: number = 1
    ): Promise<void> {
        const usageInfo = await this.getUsageInfo(workspaceId);
        if (!usageInfo) {
            logger.warn(`Could not find usage info for workspace ${workspaceId}`);
            return;
        }

        try {
            await this.queue.add(
                'track-usage',
                {
                    workspaceId,
                    subscriptionId: usageInfo.subscriptionId,
                    stripeCustomerId: usageInfo.stripeCustomerId,
                    stripeMeterEventName: usageInfo.stripeMeterEventName,
                    eventType,
                    count,
                    timestamp: Date.now(),
                },
                {
                    removeOnComplete: true,
                    removeOnFail: 1000,
                }
            );
        } catch (error: any) {
            logger.error('Failed to queue usage event', error);
        }
    }

    private async getUsageInfo(workspaceId: string): Promise<
        | {
              subscriptionId: string;
              stripeCustomerId: string;
              stripeMeterEventName: string;
          }
        | undefined
    > {
        try {
            // Try cache first
            const cacheKey = `usage:info:${workspaceId}`;
            const cached = await redisConfig.client!.get(cacheKey);
            if (cached) return JSON.parse(cached);

            // Fetch from DB using models directly
            const [subscription, customer] = await Promise.all([
                Subscription.findOne({ workspaceId, status: 'active' }),
                Customer.findOne({ workspaceId }),
            ]);

            if (subscription && customer && subscription.planSnapshot.stripeMeterEventName) {
                const info = {
                    subscriptionId: (subscription._id as any).toString(),
                    stripeCustomerId: customer.stripeCustomerId,
                    stripeMeterEventName: subscription.planSnapshot.stripeMeterEventName,
                };
                // Cache for 1 hour
                await redisConfig.client!.set(cacheKey, JSON.stringify(info), 'EX', 3600);
                return info;
            }
        } catch (error: any) {
            logger.error('Error fetching usage info for tracking', error);
        }
        return undefined;
    }
}

export const usageProducer = new UsageProducer();
