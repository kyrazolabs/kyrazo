import { Queue, Worker } from 'bullmq';
import { redisConfig } from '@/configs/redis';
import { logger, Usage } from '@kyrazo/shared';
import { Types } from 'mongoose';
import { subscriptionService } from '@/modules/subscriptions/subscription.service';
import stripe from '@/configs/stripe';

const USAGE_QUEUE_NAME = 'usage-tracking';

interface UsageEvent {
    workspaceId: string;
    subscriptionId: string;
    stripeCustomerId: string;
    stripeMeterEventName: string;
    eventType: string;
    count: number;
    timestamp: number;
}

export class UsageService {
    public queue!: Queue;
    public worker!: Worker;

    constructor() {}

    public init() {
        this.queue = new Queue(USAGE_QUEUE_NAME, {
            connection: redisConfig.getQueueClient(),
        });

        this.worker = new Worker(
            USAGE_QUEUE_NAME,
            async job => {
                await this.processUsageBatch(job.data);
            },
            {
                connection: redisConfig.getQueueClient().options,
                concurrency: 5, // Process multiple batches in parallel
            }
        );

        this.worker.on('failed', (job, err) => {
            logger.error(`Usage tracking job failed: ${job?.id}`, err);
        });
    }

    /**
     * Buffer usage event to Redis queue
     */
    async trackEvent(
        workspaceId: string,
        subscriptionId: string,
        stripeCustomerId: string,
        stripeMeterEventName: string,
        eventType: string,
        count: number = 1
    ): Promise<void> {
        await this.queue.add(
            'track-usage',
            {
                workspaceId,
                subscriptionId,
                stripeCustomerId,
                stripeMeterEventName,
                eventType,
                count,
                timestamp: Date.now(),
            },
            {
                removeOnComplete: 100,
                removeOnFail: 1000,
            }
        );
    }

    /**
     * Process a batch of usage events and update MongoDB
     * Note: In a real high-load scenario, we would batch these in Redis first.
     * For now, we process each job (event) but we can optimize to bulk write.
     */
    private async processUsageBatch(data: UsageEvent): Promise<void> {
        const {
            workspaceId,
            subscriptionId,
            stripeCustomerId,
            stripeMeterEventName,
            eventType,
            count,
            timestamp,
        } = data;
        const date = new Date(timestamp);

        // Normalize to start of the day/month for aggregation
        const periodStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const periodEnd = new Date(
            date.getFullYear(),
            date.getMonth() + 1,
            0,
            23,
            59,
            59
        );

        try {
            logger.info(
                `Processing usage event for workspace ${workspaceId}, subscription ${subscriptionId}, event ${eventType}`
            );

            // 1. Report to Stripe Meter (Idempotency handle by event_id or timestamp? Stripe Meters use timestamp + customer)
            // Stripe Meter events are deduplicated by event_id or by natural key if provided.
            // We can use the MongoDB _id as the event_id if we created the record first,
            // or generate a unique key.
            const idempotencyKey = `usage_${subscriptionId}_${eventType}_${timestamp}`;

            await stripe.billing.meterEvents.create({
                event_name: stripeMeterEventName,
                payload: {
                    stripe_customer_id: stripeCustomerId,
                    value: count.toString(),
                },
                identifier: idempotencyKey, // Use this for deduplication in Stripe
                timestamp: Math.floor(timestamp / 1000),
            });

            // 2. Persist to MongoDB
            await Usage.findOneAndUpdate(
                {
                    workspaceId: new Types.ObjectId(workspaceId),
                    subscriptionId: new Types.ObjectId(subscriptionId),
                    eventType,
                    periodStart,
                },
                {
                    $inc: { count: count },
                    $setOnInsert: {
                        stripeMeterEventName,
                        periodEnd,
                        aggregatedAt: new Date(),
                    },
                    $set: { reported: true },
                },
                { upsert: true, new: true }
            );

            // 3. Update real-time usage counter in Redis
            const currentMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const redisKey = `usage:events:${workspaceId}:${currentMonth}`;
            const client = redisConfig.getClient();
            await client.incrby(redisKey, count);
            await client.expire(redisKey, 60 * 60 * 24 * 35);
        } catch (error) {
            logger.error('Failed to update usage', error as Error);
            throw error;
        }
    }
    async getMonthlyUsage(subscriptionId: string, date: Date): Promise<number> {
        const periodStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const usage = await Usage.aggregate([
            {
                $match: {
                    subscriptionId: new Types.ObjectId(subscriptionId),
                    periodStart: periodStart,
                },
            },
            {
                $group: {
                    _id: null,
                    totalCount: { $sum: '$count' },
                },
            },
        ]);

        return usage.length > 0 ? usage[0].totalCount : 0;
    }

    async getPendingUsage(subscriptionId: string) {
        return await Usage.find({
            subscriptionId,
            reported: { $ne: true },
        });
    }

    async markUsageAsReported(usageId: Types.ObjectId) {
        await Usage.updateOne({ _id: usageId }, { reported: true });
    }
}

export const usageService = new UsageService();
