import { connect } from 'nats';
import * as dotenv from 'dotenv';
import { logger } from '@kyrazo/shared';

// Load environment variables
dotenv.config();

const NATS_SERVERS = process.env.NATS_SERVERS || 'nats://192.168.8.2:4222';
const NATS_USER = process.env.NATS_USER;
const NATS_PASSWORD = process.env.NATS_PASSWORD;

/**
 * NATS Cleanup Script
 * Run this to remove specific orphaned or conflicting durable consumers
 * Usage: bun run clean:nats
 */
async function runCleanup() {
    logger.info(`🔌 Connecting to NATS at ${NATS_SERVERS}...`);
    
    try {
        const nc = await connect({ 
            servers: NATS_SERVERS, 
            user: NATS_USER, 
            pass: NATS_PASSWORD 
        });
        
        logger.info('✅ Connected to NATS successfully.');
        const jsm = await nc.jetstreamManager();
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

        // Optional: List remaining consumers for visibility
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

        await nc.close();
        logger.info('👋 Disconnected from NATS. Cleanup complete.');
        process.exit(0);
    } catch (e: any) {
        logger.error(`💥 Fatal Error during NATS connection/cleanup: ${e.message}`);
        process.exit(1);
    }
}

runCleanup();
