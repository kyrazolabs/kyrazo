import { redisConfig, natsConfig } from '@/config';
import { clickhouseConfig, databaseConfig, logger, Source, Endpoint } from '@kyrazo/shared';
import { lifecycle } from './worker.lifecycle';
import { WorkerConsumer } from '@/consumers/nats/nats.listener';
import { env } from './worker.env';
import { dispatchProducer } from '@/consumers/batch/dispatch.producer';
import { ingestProducer } from '@/consumers/batch/ingest.producer';
import { dispatchConsumer } from '@/consumers/queues/dispatch.consumer';

export const bootstrap = async () => {
    lifecycle();
    try {
        await databaseConfig.connect();
        logger.info('Database connected successfully');

        // Sync indexes
        await Source.syncIndexes();
        await Endpoint.syncIndexes();
        logger.info('MongoDB indexes synced');

        await redisConfig.connect();
        logger.info('Redis connected successfully');

        await clickhouseConfig.connect();
        logger.info('ClickHouse connected successfully');

        await natsConfig.connect().then(() => {
            logger.info('NATS connected successfully');
        });

        // Initialize BullMQ Components after Redis is ready
        await dispatchConsumer.initialize();
        await dispatchProducer.initialize();
        await ingestProducer.initialize();
        const workerConsumer = new WorkerConsumer(env.worker.WORKSPACE_ID!);
        workerConsumer.start().catch((err: any) => {
            logger.error('WorkerConsumer failed:', err);
        });

        return true;
    } catch (error: any) {
        logger.error('Failed to initialize connections:', error);
        return false;
    }
};
