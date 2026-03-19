import { logger, type SQLIngestEvent, Source, secretCrypto } from '@kyrazo/shared';
import { slackValidator } from './slack.validator';
import { slackSignature } from './slack.signature';
import { slackTransformer } from './slack.transformer';
import type { IReceivedEvent } from '@/types/events/event.types';
import { redisConfig } from '@/config';
import { ingestProducer } from '@/consumers/batch/ingest.producer';
import { receiverTransformer } from '../../receiver.transformer';
import { ingestAnalyticsProducer } from '@/services/analytics/ingest.producer';

export class SlackPipeline {
    private static instance: SlackPipeline;
    constructor() {}
    public static getInstance(): SlackPipeline {
        if (!SlackPipeline.instance) {
            SlackPipeline.instance = new SlackPipeline();
        }
        return SlackPipeline.instance;
    }

    public async process(event: IReceivedEvent): Promise<void> {
        try {
            if (!slackValidator.validate(event)) {
                logger.debug('[SlackPipeline] Invalid event structure, skipping');
                return;
            }

            const source = await redisConfig.cache(
                `source:${event.sourceId}`,
                async () => {
                    return await Source.findById(event.sourceId).populate('endpoints');
                },
                60 * 60 * 24
            );

            if (!source) {
                logger.error(`[SlackPipeline] Source not found: ${event.sourceId}`);
                return;
            }

            // Transform for target mapping and signature verification
            const dispatchedEvent = slackTransformer.transform(
                event as IReceivedEvent<any>,
                source.endpoints || []
            );

            // Transform for storage/analytics
            const data: SQLIngestEvent = receiverTransformer.transform({
                ...event,
                body: dispatchedEvent.data,
                source: 'slack',
                sourceId: event.sourceId,
                namespaceId: event.namespaceId,
                workspaceId: event.workspaceId,
            });

            // Handle url_verification challenge
            if (event.body.type === 'url_verification') {
                logger.info('[SlackPipeline] Handling url_verification challenge');
                // The challenge response is usually handled by the Ingest API synchronously
                // but we should still record it as a verified event if possible.
                await this.enqueue(data, true);
                return;
            }

            // Verify Slack signature
            const credentials = source.authentication?.credentials as any;
            if (!credentials?.secret || !credentials?.iv) {
                logger.warn(
                    `[SlackPipeline] Source ${event.sourceId} is missing authentication credentials, skipping signature verification`
                );
                await this.enqueue(data, false);
                return;
            }

            let sourceSecret: string;
            try {
                sourceSecret = secretCrypto.decrypt(
                    credentials.secret,
                    credentials.iv,
                    source.namespaceId.toString()
                );
            } catch (error: any) {
                logger.warn(
                    `[SlackPipeline] Failed to decrypt source secret for ${event.sourceId}, attempting fallback:`,
                    error
                );
                sourceSecret = credentials.secret;
            }

            if (!sourceSecret) {
                logger.error(`[SlackPipeline] No source secret available for ${event.sourceId}`);
                await this.enqueue(data, false);
                return;
            }

            const payloadToVerify = event.rawBody || JSON.stringify(event.body);
            const signatureHeader = event.headers['x-slack-signature'] as string;
            const timestampHeader = event.headers['x-slack-request-timestamp'] as string;

            if (
                !slackSignature.verify(
                    payloadToVerify,
                    signatureHeader,
                    timestampHeader,
                    sourceSecret
                )
            ) {
                logger.warn(`[SlackPipeline] Invalid Slack signature for event: ${event.eventId}`);
                await this.enqueue(data, false);
                return;
            }

            await this.enqueue(data, true);

            logger.info('✅ Successfully processed Slack event', event.eventId);
        } catch (error: any) {
            logger.error('❌ Error processing Slack event:', error);
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

export const slackPipeline = SlackPipeline.getInstance();
