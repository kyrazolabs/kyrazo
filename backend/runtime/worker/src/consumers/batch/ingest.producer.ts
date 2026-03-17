import { redisConfig } from '@/config';
import { logger, type SQLIngestEvent } from '@kyrazo/shared';
import { Redis } from 'ioredis';

export class IngestProducer {
    private static instance: IngestProducer;
    private redis!: Redis;

    public readonly streamName = 'stream:ingest-events';

    private constructor() {}

    public async initialize(): Promise<void> {
        this.redis = redisConfig.getQueueClient();
        logger.info('[IngestProducer] Initializing Redis Stream Producer...');
        // Ensure connection is ready
        if (this.redis.status === 'wait') {
            await this.redis.connect().catch(err => {
                logger.warn(
                    '[IngestProducer] Redis connection attempt failed, may already be connected:',
                    err
                );
            });
        }
        logger.info(`[IngestProducer] Redis Stream Producer aligned with ${this.streamName}`);
    }

    public static getInstance(): IngestProducer {
        if (!IngestProducer.instance) {
            IngestProducer.instance = new IngestProducer();
        }
        return IngestProducer.instance;
    }

    // Public API to access the queue for producers
    public getQueues() {
        return {
            // Provide a shim that matches the BullMQ add method signature for easy refactoring
            IngestQueue: {
                add: async (name: string, data: SQLIngestEvent) => {
                    await this.publish(data);
                },
            },
        };
    }

    public getQueueNames() {
        return {
            IngestQueue: this.streamName,
        };
    }

    private async publish(data: SQLIngestEvent): Promise<void> {
        try {
            const payload = {
                payload: JSON.stringify(data),
            };

            await this.redis.xadd(this.streamName, '*', 'payload', payload.payload);
            logger.debug(
                `[IngestProducer] Successfully added ingest event ${data.event_id} to stream`
            );
        } catch (error: any) {
            logger.error('[IngestProducer] Failed to add event to Redis stream:', error);
            throw error;
        }
    }

    public async close() {}
}

export const ingestProducer = IngestProducer.getInstance();
