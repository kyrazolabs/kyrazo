import { logger, type SQLIngestEvent, Source, secretCrypto, unprefixId, prefixId, RedisKeys } from '@kyrazo/shared';
import { ProcessingStatus } from '@/types/events/event.types';
import { shopifyValidator } from './shopify.validator';
import { shopifySignature } from './shopify.signature';
import { shopifyTransformer } from './shopify.transformer';
import type { IReceivedEvent } from '@/types/events/event.types';
import { redisConfig } from '@/config';
import { ingestProducer } from '@/consumers/batch/ingest.producer';
import { receiverTransformer } from '../../receiver.transformer';
import { ingestAnalyticsProducer } from '@/services/analytics/ingest.producer';

export class ShopifyPipeline {
    private static instance: ShopifyPipeline;
    constructor() {}
    public static getInstance(): ShopifyPipeline {
        if (!ShopifyPipeline.instance) {
            ShopifyPipeline.instance = new ShopifyPipeline();
        }
        return ShopifyPipeline.instance;
    }

    public async process(event: IReceivedEvent): Promise<void> {
        try {
            event.processingStatus = ProcessingStatus.PROCESSED;
            if (!shopifyValidator.validate(event)) {
                logger.debug('[ShopifyPipeline] Invalid event structure, skipping');
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
                logger.error(`[ShopifyPipeline] Source not found: ${event.sourceId}`);
                return;
            }

            // Transform to IDispatchedEvent for verification and target mapping
            const dispatchedEvent = shopifyTransformer.transform(event, source.endpoints || []);

            // Transform for storage/analytics
            const data: SQLIngestEvent = receiverTransformer.transform({
                ...event,
                body: dispatchedEvent.data,
                source: 'shopify',
                sourceId: event.sourceId,
                namespaceId: event.namespaceId,
                workspaceId: event.workspaceId,
            });

            // 2. Verify Shopify signature
            const credentials = source.authentication?.credentials as any;
            if (!credentials?.secret || !credentials?.iv) {
                logger.warn(
                    `[ShopifyPipeline] Source ${event.sourceId} is missing authentication credentials, skipping signature verification`
                );
                await this.enqueue(data, false);
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
                    `[ShopifyPipeline] Failed to decrypt source secret for ${event.sourceId}, attempting fallback to raw value:`,
                    error
                );
                sourceSecret = credentials.secret;
            }

            if (!sourceSecret) {
                logger.error(`[ShopifyPipeline] No source secret available for ${event.sourceId}`);
                await this.enqueue(data, false);
                return;
            }

            const payloadToVerify = event.rawBody || JSON.stringify(event.body);
            const signatureHeader = event.headers['x-shopify-hmac-sha256'] as string;

            if (
                !signatureHeader ||
                !shopifySignature.verify(payloadToVerify, signatureHeader, sourceSecret)
            ) {
                logger.warn(
                    `[ShopifyPipeline] Invalid Shopify signature for event: ${event.eventId}`
                );
                await this.enqueue(data, false);
                return;
            }

            await this.enqueue(data, true);

            logger.info('✅ Successfully processed Shopify event', event.eventId);
        } catch (error: any) {
            logger.error('❌ Error processing Shopify event:', error);
            throw error;
        }
    }

    private async enqueue(data: SQLIngestEvent, verified: boolean): Promise<void> {
        await ingestProducer
            .getQueues()
            .IngestQueue.add(ingestProducer.getQueueNames().IngestQueue, {
                ...data,
                verified,
            });
        await ingestAnalyticsProducer.record({
            namespaceId: data.namespace_id,
            sourceId: data.source_id,
            status: data.processing_status,
            timestamp: data.processed_at,
        });
    }
}

export const shopifyPipeline = ShopifyPipeline.getInstance();
