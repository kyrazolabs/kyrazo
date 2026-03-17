import { WebhookType } from '@/types/events';
import { logger } from '@kyrazo/shared';
import { dispatcherHeaders } from './dispatcher.headers';
import { dispatcherQueue } from './dispatcher.queue';
import { dispatcherTransformer } from './dispatcher.transformer';
import { dispatcherValidator } from './dispatcher.validator';
import { redisConfig } from '@/config';

/**
 * @title Dispatcher Pipeline
 * @description End-to-end processing pipeline:
 *              Validate → Transform → Sign → Deliver
 */
export class DispatcherPipeline {
    /**
     * Process a publish event from JetStream
     */
    public async process(messageData: any): Promise<void> {
        try {
            if (!dispatcherValidator.validate(messageData)) {
                logger.debug('Invalid event structure, skipping');
                return;
            }

            // Deduplicate Original Event ID (handles NATS duplicates)
            const dedupKey = `processed:event:${messageData.eventId}`;
            const isNew = await redisConfig.getQueueClient().set(dedupKey, '1', 'EX', 3600, 'NX');
            if (!isNew) {
                logger.warn(
                    `♻️ Duplicate event received from NATS, skipping: ${messageData.eventId}`
                );
                return;
            }

            if (!dispatcherValidator.shouldProcess(messageData.sourceType, WebhookType.PUBLISH)) {
                logger.debug(`Skipping non-publish event: ${messageData.sourceType}`);
                return;
            }

            logger.debug(`📨 Processing publish event: ${messageData.eventId}`);

            if (!dispatcherValidator.shouldProcess(messageData.sourceType, WebhookType.PUBLISH)) {
                logger.debug(`Skipping non-publish event: ${messageData.sourceType}`);
                return;
            }

            logger.info(`📨 Processing publish event: ${messageData.eventId}`);
            logger.info(`DEBUG: Raw messageData: ${JSON.stringify(messageData, null, 2)}`);

            const envelope = dispatcherTransformer.transform(messageData);
            logger.info(
                `📦 Event transformed. NamespaceId: ${envelope.namespaceId}, WorkspaceId: ${envelope.workspaceId}, Targets: ${envelope.targets.length}`
            );
            const headers = await dispatcherHeaders.buildHeaders(envelope, 1);
            const targets = envelope.targets;

            if (targets.length === 0) {
                logger.warn(`No targets found for event ${envelope.id}, skipping dispatch`);
                return;
            }

            await dispatcherQueue.enqueue(envelope, headers, targets);

            logger.debug(`✅ Publish event processed: ${messageData.eventId}`);
        } catch (error: any) {
            logger.error('❌ Error processing publish event:', {
                message: error.message,
                stack: error.stack,
                ...error
            });
            throw error;
        }
    }
}

export const dispatcherPipeline = new DispatcherPipeline();
