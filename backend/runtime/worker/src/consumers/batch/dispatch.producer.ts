import { redisConfig } from '@/config';
import { logger, type SQLDeliveryAttempt } from '@kyrazo/shared';
import { Redis } from 'ioredis';

export class DispatchProducer {
    private static instance: DispatchProducer;
    private redis!: Redis;

    public readonly streamName = 'stream:dispatch-events';

    private constructor() {
        // Use a standard Redis client for stream operations, not the BullMQ queue client
        // to avoid conflicts if they share state differently. redisConfig provides caching
        // clients usually, but we can reuse the queue client or better, a dedicated standard client.
    }

    public async initialize(): Promise<void> {
        this.redis = redisConfig.getQueueClient();
        logger.info('[DispatchProducer] Initializing Redis Stream Producer...');
        // Ensure connection is ready
        if (this.redis.status === 'wait') {
            await this.redis.connect().catch(err => {
                logger.warn(
                    '[DispatchProducer] Redis connection attempt failed, may already be connected:',
                    err
                );
            });
        }
        logger.info(`[DispatchProducer] Redis Stream Producer aligned with ${this.streamName}`);
    }

    public static getInstance(): DispatchProducer {
        if (!DispatchProducer.instance) {
            DispatchProducer.instance = new DispatchProducer();
        }
        return DispatchProducer.instance;
    }

    // Public API to access the queue for producers (like DispatchConsumer)
    public getQueues() {
        return {
            // Provide a shim that matches the BullMQ add method signature for easy refactoring
            DispatchsQueue: {
                add: async (name: string, data: SQLDeliveryAttempt) => {
                    await this.publish(data);
                },
            },
        };
    }

    public getQueueNames() {
        return {
            DispatchProducer: this.streamName,
        };
    }

    private async publish(data: SQLDeliveryAttempt): Promise<void> {
        try {
            // Flatten the object for Redis Hashes/Streams or serialize as JSON
            const payload = {
                payload: JSON.stringify(data),
            };

            await this.redis.xadd(this.streamName, '*', 'payload', payload.payload);
            logger.debug(
                `[DispatchProducer] Successfully added delivery attempt ${data.delivery_id} to stream`
            );
        } catch (error: any) {
            logger.error('[DispatchProducer] Failed to add event to Redis stream:', error);
            // Re-throw to allow caller to handle retry if needed
            throw error;
        }
    }

    public async close() {
        // Depending on Redis configuration, might need to leave it open for other parts,
        // but typically a producer doesn't need to close shared connections explicitly
        // unless they hold a dedicated connection.
    }
}

export const dispatchProducer = DispatchProducer.getInstance();
