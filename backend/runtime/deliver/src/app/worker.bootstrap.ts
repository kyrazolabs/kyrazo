import { redisConfig } from '@/config';
import { databaseConfig, logger } from '@kyrazo/shared';
import { lifecycle } from './worker.lifecycle';
import { dispatchProducer } from '@/transports/batch/dispatch.producer';
import { dispatchConsumer } from '@/transports/queues/dispatch.consumer';
import { s3Transport } from '@/transports/storage/s3.transport';

export const bootstrap = async () => {
    lifecycle();
    try {
        await databaseConfig.connect();
        logger.info('Database connected successfully');

        await redisConfig.connect();
        logger.info('Redis connected successfully');

        // Initialize BullMQ Components after Redis is ready
        await dispatchConsumer.initialize();
        await dispatchProducer.initialize();
        await s3Transport.initialize();

        return true;
    } catch (error: any) {
        logger.error('Failed to initialize connections:', error);
        return false;
    }
};
