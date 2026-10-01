import { logger, type SQLIngestEvent, Source, secretCrypto, unprefixId, prefixId, RedisKeys } from '@kyrazo/shared';
import { webflowValidator } from './webflow.validator';
import { webflowSignature } from './webflow.signature';
import { webflowTransformer } from './webflow.transformer';
import { ProcessingStatus, type IReceivedEvent } from '@/types/events/event.types';
import { redisConfig } from '@/config';
import { ingestProducer } from '@/consumers/batch/ingest.producer';
import { receiverTransformer } from '../../receiver.transformer';
import { ingestAnalyticsProducer } from '@/services/analytics/ingest.producer';

export class WebflowPipeline {
    private static instance: WebflowPipeline;
    constructor() {}
    public static getInstance(): WebflowPipeline {
        if (!WebflowPipeline.instance) {
            WebflowPipeline.instance = new WebflowPipeline();
        }
        return WebflowPipeline.instance;
    }

    public async process(event: IReceivedEvent): Promise<void> {
        try {
            event.processingStatus = ProcessingStatus.PROCESSED;
            if (!webflowValidator.validate(event)) {
                logger.debug('[WebflowPipeline] Invalid event structure, skipping');
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
                logger.error(`[WebflowPipeline] Source not found: ${event.sourceId}`);
                return;
            }

            // Transform for target mapping and signature verification
            const dispatchedEvent = webflowTransformer.transform(
                event as IReceivedEvent<any>,
                source.endpoints || []
            );

            // Transform for storage/analytics
            const data: SQLIngestEvent = receiverTransformer.transform({
                ...event,
                body: dispatchedEvent.data,
                source: 'webflow',
                sourceId: event.sourceId,
                namespaceId: event.namespaceId,
                workspaceId: event.workspaceId,
            });

            // Verify Webflow signature
            const credentials = source.authentication?.credentials as any;
            if (!credentials?.secret || !credentials?.iv) {
                logger.warn(
                    `[WebflowPipeline] Source ${event.sourceId} is missing authentication credentials, skipping signature verification`
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
                    `[WebflowPipeline] Failed to decrypt source secret for ${event.sourceId}, attempting fallback:`,
                    error
                );
                sourceSecret = credentials.secret;
            }

            if (!sourceSecret) {
                logger.error(`[WebflowPipeline] No source secret available for ${event.sourceId}`);
                await this.enqueue(data, false);
                return;
            }

            const payloadToVerify = event.rawBody || JSON.stringify(event.body);
            const signatureHeader = event.headers['x-webflow-signature'] as string;
            const timestampHeader = event.headers['x-webflow-timestamp'] as string;

            if (
                !webflowSignature.verify(
                    payloadToVerify,
                    signatureHeader,
                    timestampHeader,
                    sourceSecret
                )
            ) {
                logger.warn(
                    `[WebflowPipeline] Invalid Webflow signature for event: ${event.eventId}`
                );
                await this.enqueue(data, false);
                return;
            }

            await this.enqueue(data, true);

            logger.info('✅ Successfully processed Webflow event', event.eventId);
        } catch (error: any) {
            logger.error('❌ Error processing Webflow event:', error);
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

export const webflowPipeline = WebflowPipeline.getInstance();
