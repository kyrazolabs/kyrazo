import { Queue } from 'bullmq';
import { redisConfig } from '@/config';
import { logger, snowflake } from '@kyrazo/shared';
import type {
    IConfiguredTarget,
    IDispatchedEvent,
    IWebhookHeaders,
} from '@/core/dispatcher/dispatcher.types';

/**
 * Event Processor - Coordinates event processing and queue management
 * Manages the overall event processing workflow and queue lifecycle
 */
export class DispatchProducer {
    private static instance: DispatchProducer;

    private dispatchQueue: Queue | undefined;

    private constructor() {}

    public async initialize(): Promise<void> {
        if (this.dispatchQueue) return;

        logger.info('Initializing Dispatch Producer...');
        const connection = redisConfig.getQueueClient();

        // Initialize queues
        this.dispatchQueue = new Queue(`{event-dispatch}`, {
            connection,
            defaultJobOptions: {
                removeOnComplete: true, // Keep last 100 completed jobs
                removeOnFail: {
                    count: 1000, // Keep last 1000 failed for inspection
                    age: 7 * 24 * 60 * 60, // Or 7 days
                },
                attempts: 3,
                backoff: {
                    type: 'stepped',
                },
            },
        });

        logger.info('🚀 Event Producer ({event-dispatch}) initialized');
    }

    public static getInstance(): DispatchProducer {
        if (!DispatchProducer.instance) {
            DispatchProducer.instance = new DispatchProducer();
        }
        return DispatchProducer.instance;
    }

    public async enqueue(
        event: IDispatchedEvent,
        targets: IConfiguredTarget[],
        headers: IWebhookHeaders,
        transform?: { id: string; code: string }
    ): Promise<(string | undefined)[]> {
        if (!this.dispatchQueue) {
            throw new Error('DispatchProducer not initialized');
        }
        try {
            const jobData = {
                event,
                headers,
                transform,
            };

            const jobs = await this.dispatchQueue.addBulk(
                targets.map(target => {
                    const deliveryId = snowflake.generate();
                    // Retry count is the number of *retries*, so total attempts = retries + 1
                    const attempts = (target.retryCount || 3) + 1;
                    return {
                        name: 'dispatch',
                        data: { ...jobData, deliveryId, target },
                        opts: {
                            jobId: deliveryId,
                            delay: 0, // Process immediately
                            attempts: attempts, // Set total attempts
                        },
                    };
                })
            );

            const jobIds = jobs.map(job => job.id);
            const deliveryIds = jobs.map(job => job.opts.jobId);

            logger.info(`📦 Added dispatch job to queue: ${jobIds.join(', ')}`);

            return jobIds || deliveryIds;
        } catch (error: any) {
            console.error('Error adding job to dispatch queue:', error);
            throw error;
        }
    }

    public async shutdown(): Promise<void> {
        console.log('🔄 Shutting down event producer...');

        try {
            await this.dispatchQueue?.close();

            console.log('✅ Event producer shutdown complete');
        } catch (error: any) {
            console.error('❌ Error shutting down event producer:', error);
            throw error;
        }
    }

    public async forceProcessAll(): Promise<void> {
        if (!this.dispatchQueue) {
            throw new Error('DispatchConsumer not initialized');
        }
        console.log('🚀 Force processing all waiting jobs...');

        try {
            const waitingJobs = await this.dispatchQueue.getWaiting();
            for (const job of waitingJobs) {
                await job.promote();
            }
            console.log(`✅ Promoted ${waitingJobs.length} jobs for immediate processing`);
        } catch (error: any) {
            console.error('❌ Error force processing jobs:', error);
            throw error;
        }
    }
}

export const dispatchProducer = DispatchProducer.getInstance();
