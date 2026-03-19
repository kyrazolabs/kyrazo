import { logger, type SQLIngestEvent, Source, secretCrypto, unprefixId, prefixId } from '@kyrazo/shared';
import { githubValidator } from './github.validator';
import { githubSignature } from './github.signature';
import { githubTransformer } from './github.transformer';
import type { IReceivedEvent } from '@/types/events/event.types';
import { redisConfig } from '@/config';
import { ingestProducer } from '@/consumers/batch/ingest.producer';
import { receiverTransformer } from '../../receiver.transformer';
import { ingestAnalyticsProducer } from '@/services/analytics/ingest.producer';

export class GitHubPipeline {
    private static instance: GitHubPipeline;
    constructor() {}
    public static getInstance(): GitHubPipeline {
        if (!GitHubPipeline.instance) {
            GitHubPipeline.instance = new GitHubPipeline();
        }
        return GitHubPipeline.instance;
    }

    public async process(event: IReceivedEvent): Promise<void> {
        try {
            // Check for application/x-www-form-urlencoded specific "payload" key
            if (event.body && event.body.payload && typeof event.body.payload === 'string') {
                try {
                    event.body = JSON.parse(event.body.payload);
                } catch (e) {
                    logger.warn('[GitHubPipeline] Failed to parse URL encoded payload:', e);
                }
            }

            if (!githubValidator.validate(event)) {
                logger.debug('[GitHubPipeline] Invalid event structure, skipping');
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
                logger.error(`[GitHubPipeline] Source not found: ${event.sourceId}`);
                return;
            }

            // Transform to IDispatchedEvent for verification and target mapping
            const dispatchedEvent = githubTransformer.transform(event, source.endpoints || []);

            // Transform for storage/analytics
            const data: SQLIngestEvent = receiverTransformer.transform({
                ...event,
                body: dispatchedEvent.data,
                source: 'github',
                sourceId: event.sourceId,
                namespaceId: event.namespaceId,
                workspaceId: event.workspaceId,
            });

            // 2. Verify GitHub signature
            const credentials = source.authentication?.credentials as any;
            if (!credentials?.secret || !credentials?.iv) {
                logger.warn(
                    `[GitHubPipeline] Source ${event.sourceId} is missing authentication credentials, skipping signature verification`
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
                    `[GitHubPipeline] Failed to decrypt source secret for ${event.sourceId}, attempting fallback to raw value:`,
                    error
                );
                sourceSecret = credentials.secret;
            }

            if (!sourceSecret) {
                logger.error(`[GitHubPipeline] No source secret available for ${event.sourceId}`);
                await this.enqueue(data, false);
                return;
            }

            const payloadToVerify = event.rawBody || JSON.stringify(event.body);
            const signatureHeader = event.headers['x-hub-signature-256'] as string;

            if (
                !signatureHeader ||
                !githubSignature.verify(payloadToVerify, signatureHeader, sourceSecret)
            ) {
                logger.warn(
                    `[GitHubPipeline] Invalid GitHub signature for event: ${event.eventId}`
                );
                await this.enqueue(data, false);
                return;
            }

            await this.enqueue(data, true);

            logger.info('✅ Successfully processed GitHub event', event.eventId);
        } catch (error: any) {
            logger.error('❌ Error processing GitHub event:', error);
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

export const githubPipeline = GitHubPipeline.getInstance();
