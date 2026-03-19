import { logger, type SQLIngestEvent, Source, secretCrypto, unprefixId, prefixId } from '@kyrazo/shared';
import { stripeValidator } from './stripe.validator';
import { stripeSignature } from './stripe.signature';
import type { IReceivedEvent } from '@/types/events/event.types';
import { redisConfig } from '@/config';
import { ingestProducer } from '@/consumers/batch/ingest.producer';
import { receiverTransformer } from '../../receiver.transformer';
import { ingestAnalyticsProducer } from '@/services/analytics/ingest.producer';

export class StripePipeline {
    private static instance: StripePipeline;
    constructor() {}
    public static getInstance(): StripePipeline {
        if (!StripePipeline.instance) {
            StripePipeline.instance = new StripePipeline();
        }
        return StripePipeline.instance;
    }

    public async process(event: IReceivedEvent): Promise<void> {
        try {
            if (!stripeValidator.validate(event)) {
                logger.debug('[StripePipeline] Invalid event structure, skipping');
                return;
            }

            const source = await redisConfig.cache(
                `source:${event.sourceId}`,
                async () => {
                    return await Source.findById(unprefixId(event.sourceId)).populate('endpoints');
                },
                60 * 60 * 24
            );

            if (!source) {
                logger.error(`[StripePipeline] Source not found: ${event.sourceId}`);
                return;
            }

            const data: SQLIngestEvent = receiverTransformer.transform(event);

            // 2. Verify Stripe signature
            const credentials = source.authentication?.credentials as any;
            if (!credentials?.secret || !credentials?.iv) {
                logger.warn(
                    `[StripePipeline] Source ${event.sourceId} is missing authentication credentials, skipping signature verification`
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
                sourceSecret = secretCrypto.decrypt(
                    credentials.secret,
                    credentials.iv,
                    prefixId(source.namespaceId, 'namespace') as string
                );
            } catch (error: any) {
                logger.warn(
                    `[StripePipeline] Failed to decrypt source secret for ${event.sourceId}, attempting fallback to raw value:`,
                    error
                );
                sourceSecret = credentials.secret;
            }

            if (!sourceSecret) {
                logger.error(`[StripePipeline] No source secret available for ${event.sourceId}`);
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
            const signatureHeader = event.headers['stripe-signature'];

            if (
                !signatureHeader ||
                !stripeSignature.verify(payloadToVerify, signatureHeader, sourceSecret)
            ) {
                logger.warn(
                    `[StripePipeline] Invalid Stripe signature for event: ${event.eventId}`
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

            logger.info('✅ Successfully processed Stripe event', event.eventId);
        } catch (error: any) {
            logger.error('❌ Error processing Stripe event:', error);
            throw error;
        }
    }
}

export const stripePipeline = StripePipeline.getInstance();
