import { redisConfig, natsConfig, clickhouseConfig } from '@/config';
import { dispatchProducer } from '@/consumers/batch/dispatch.producer';
import { ingestProducer } from '@/consumers/batch/ingest.producer';
import { dispatchConsumer } from '@/consumers/queues/dispatch.consumer';
import { databaseConfig, logger } from '@kyrazo/shared';

// Graceful shutdown handler
let isShuttingDown = false;

const gracefulShutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    await dispatchProducer.close();
    await ingestProducer.close();
    await dispatchConsumer.shutdown();

    try {
        await databaseConfig.disconnect();
        logger.info('Database connection closed');
    } catch (error: any) {
        logger.error('Error closing database connection:', error);
    }

    // Close Redis connection
    try {
        await redisConfig.disconnect();
        logger.info('Redis connection closed');
    } catch (error: any) {
        logger.error('Error closing Redis connection:', error);
    }

    // Close NATS connection
    try {
        await natsConfig.disconnect();
        logger.info('NATS connection closed');
    } catch (error: any) {
        logger.error('Error closing NATS connection:', error);
    }

    // Close ClickHouse connection
    try {
        await clickhouseConfig.disconnect();
        logger.info('ClickHouse connection closed');
    } catch (error: any) {
        logger.error('Error closing ClickHouse connection:', error);
    }

    // Force close after 30 seconds
    setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 30000);
};

export const lifecycle = async () => {
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        logger.info('\n👋 Shutting down worker...');
        await gracefulShutdown('SIGINT');
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        logger.info('\n👋 Shutting down worker...');
        await gracefulShutdown('SIGTERM');
        process.exit(0);
    });

    process.on('uncaughtException', async (error: any) => {
        logger.error('Uncaught Exception:', error);
        await gracefulShutdown('uncaughtException');
        process.exit(1);
    });
};
