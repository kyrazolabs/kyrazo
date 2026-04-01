import { logger, type SQLIngestEvent, Source, secretCrypto, unprefixId, prefixId, RedisKeys } from '@kyrazo/shared';
import { ProcessingStatus } from '@/types/events/event.types';
import { paypalValidator } from './paypal.validator';
import { paypalSignature } from './paypal.signature';
import type { IReceivedEvent } from '@/types/events/event.types';
import { redisConfig } from '@/config';
import { ingestProducer } from '@/consumers/batch/ingest.producer';
import { receiverTransformer } from '../../receiver.transformer';
import { ingestAnalyticsProducer } from '@/services/analytics/ingest.producer';

export class PayPalPipeline {
    private static instance: PayPalPipeline;
    constructor() {}
    public static getInstance(): PayPalPipeline {
        if (!PayPalPipeline.instance) {
            PayPalPipeline.instance = new PayPalPipeline();
        }
        return PayPalPipeline.instance;
    }

    public async process(event: IReceivedEvent): Promise<void> {
        try {
            event.processingStatus = ProcessingStatus.PROCESSED;
            if (!paypalValidator.validate(event)) {
                logger.debug('Invalid event structure, skipping');
                return;
            }

            const source = await redisConfig.cache(
                RedisKeys.context.source(event.sourceId),
                async () => {
                    return await Source.findById(unprefixId(event.sourceId)).populate('endpoints');
                },
                60 * 60 * 24
            );

            if (!source) {
                logger.error(`Source not found: ${event.sourceId}`);
                return;
            }

            const data: SQLIngestEvent = receiverTransformer.transform(event);

            // 2. Verify PayPal signature
            if (
                !(source.authentication?.credentials as any)?.secret ||
                !(source.authentication?.credentials as any)?.iv
            ) {
                logger.warn(
                    `Source ${event.sourceId} is missing authentication credentials, skipping signature verification`
                );
                await ingestProducer
                    .getQueues()
                    .IngestQueue.add(ingestProducer.getQueueNames().IngestQueue, {
                        ...data,
                        verified: false,
                    });
                await ingestAnalyticsProducer.record({
                    namespaceId: data.namespace_id,
                    sourceId: data.source_id,
                    status: data.processing_status,
                    timestamp: data.processed_at,
                });
                return;
            }

            let sourceSecret: string;
            try {
                // Cast to any to avoid TS error with Mixed type
                const credentials = source.authentication?.credentials as any;
                if (!credentials?.secret) {
                    throw new Error('Missing secret');
                }
                sourceSecret = secretCrypto.decrypt(
                    credentials.secret,
                    credentials.iv,
                    prefixId(source.namespaceId, 'namespace') as string
                );
            } catch (error: any) {
                logger.warn(
                    `Failed to decrypt source secret for ${event.sourceId}, attempting fallback to raw value:`,
                    error
                );
                // Fallback: use the raw secret value (in case it was stored plaintext or user error)
                // Cast to any to avoid TS error with Mixed type
                sourceSecret = (source.authentication?.credentials as any)?.secret;
            }

            if (!sourceSecret) {
                logger.error(`No source secret available for ${event.sourceId}`);
                // ... error handling logic ...
                await ingestProducer
                    .getQueues()
                    .IngestQueue.add(ingestProducer.getQueueNames().IngestQueue, {
                        ...data,
                        verified: false,
                    });
                await ingestAnalyticsProducer.record({
                    namespaceId: data.namespace_id,
                    sourceId: data.source_id,
                    status: data.processing_status,
                    timestamp: data.processed_at,
                });
                return;
            }

            const payloadToVerify = event.rawBody || JSON.stringify(event.body);

            if (!(await paypalSignature.verify(payloadToVerify, event.headers, sourceSecret))) {
                logger.warn(`Invalid PayPal signature for event: ${event.eventId}`);

                await ingestProducer
                    .getQueues()
                    .IngestQueue.add(ingestProducer.getQueueNames().IngestQueue, {
                        ...data,
                        verified: false,
                    });
                await ingestAnalyticsProducer.record({
                    namespaceId: data.namespace_id,
                    sourceId: data.source_id,
                    status: data.processing_status,
                    timestamp: data.processed_at,
                });
                return;
            }

            await ingestProducer
                .getQueues()
                .IngestQueue.add(ingestProducer.getQueueNames().IngestQueue, {
                    ...data,
                    verified: true,
                });
            await ingestAnalyticsProducer.record({
                namespaceId: data.namespace_id,
                sourceId: data.source_id,
                status: data.processing_status,
                timestamp: data.processed_at,
            });

            logger.info('✅ Successfully processed paypal event', event.eventId);
        } catch (error: any) {
            logger.error('❌ Error processing paypal event:', error);
            throw error;
        }
    }
}

export const payPalPipeline = PayPalPipeline.getInstance();
