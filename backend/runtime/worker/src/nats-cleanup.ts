import { natsConfig } from './config/nats.config';
import { logger } from '@kyrazo/shared';

/**
 * NATS Cleanup Script
 * Run this to remove specific orphaned or conflicting durable consumers
 * Usage: bun run clean:nats
 */
async function runCleanup() {
    logger.info('🧹 Starting NATS consumer cleanup...');
    
    try {
        await natsConfig.connect();
        const jsm = natsConfig.getJetStreamManager();
        const streamName = 'EVENTS';

        // Add any known legacy or conflicting durable names here
        const legacyConsumersToRemove = [
            'worker_shared'
        ];

        logger.info(`🔍 Scanning stream '${streamName}' for consumers to remove...`);

        for (const consumerName of legacyConsumersToRemove) {
            try {
                logger.info(`Attempting to delete consumer: ${consumerName}`);
                await jsm.consumers.delete(streamName, consumerName);
                logger.info(`✅ Successfully deleted consumer '${consumerName}'`);
            } catch (err: any) {
                if (err.api_error?.err_code === 10014 || err.message?.includes('not found')) {
                    logger.warn(`⚠️ Consumer '${consumerName}' not found (already deleted).`);
                } else {
                    logger.error(`❌ Failed to delete consumer '${consumerName}': ${err.message}`);
                }
            }
        }

        try {
            logger.info('📊 Remaining consumers on stream:');
            const remaining = await jsm.consumers.list(streamName).next();
            if (remaining.length === 0) {
                logger.info('None.');
            } else {
                remaining.forEach(c => {
                    logger.info(`- ${c.name} (Filter: ${c.config.filter_subject})`);
                });
            }
        } catch (listErr: any) {
            logger.warn(`Could not list remaining consumers: ${listErr.message}`);
        }

        await natsConfig.disconnect();
        logger.info('👋 Cleanup complete.');
        process.exit(0);
    } catch (e: any) {
        logger.error(`💥 Fatal Error during NATS connection/cleanup: ${e.message}`);
        process.exit(1);
    }
}

runCleanup();
