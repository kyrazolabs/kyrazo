import { v4 as uuidv4 } from 'uuid';
import pLimit from 'p-limit';

import { natsConfig } from '@/configs/nats';
import { redisConfig, REDIS_KEYS } from '@/configs/redis';
import { config } from '@/configs';
import type { IPublishedEvent } from '@kyrazo/shared';
import { signatureCrypto, logger, prefixId, snowflake } from '@kyrazo/shared';
import type {
    BatchCreatePublishedEvent,
    CreatePublishedEvent,
} from '@/modules/v1/events/event.schema';
import {
    publishQueuesName,
    publishQueues,
} from '@/producers/jobs/v1/publishers/bullmq/publish/publish.bullmq';
import { DiscardPolicy, RetentionPolicy, StorageType } from 'nats';

/**
 * @title PublishEventPublisher
 * @description Professional NATS JetStream-based event publisher with ACK support.
 * Replaces BullMQ with NATS JetStream for reliable event delivery.
 */
export class PublishEventPublisher {
    private static instance: PublishEventPublisher;
    private isInitialized = false;

    /**
     * @title PublishEventPublisher Constructor
     * @description Private constructor to enforce singleton pattern.
     */
    private constructor() {}

    /**
     * @title Get PublishEventPublisher Instance
     * @description Returns the singleton instance of PublishEventPublisher.
     * @returns {PublishEventPublisher} The singleton instance.
     */
    public static getInstance(): PublishEventPublisher {
        if (!PublishEventPublisher.instance) {
            PublishEventPublisher.instance = new PublishEventPublisher();
        }
        return PublishEventPublisher.instance;
    }

    /**
     * @title Initialize Publisher
     * @description Ensures NATS connection is established and JetStream is ready.
     * @returns {Promise<void>} Resolves when initialization is complete.
     */
    private async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        try {
            if (!natsConfig.getConnectionStatus()) {
                await natsConfig.connect();
            }


            this.isInitialized = true;
            logger.info('NATS Event Publisher initialized successfully');
        } catch (error: unknown) {
            logger.error(
                'Failed to initialize NATS Event Publisher in publish.nats.ts ',
                error as Error
            );
            throw error;
        }
    }


    /**
     * @title Publish Event
     * @description Publishes an event to NATS JetStream with ACK support.
     * @param {IPublishedEvent} data - The event data to publish.
     * @returns {Promise<{ success: boolean; eventId: string; subject: string; stream: string; sequence: number; targetsCount: number; timestamp: number;} | null>} The published event data.
     */
    public async publish(data: CreatePublishedEvent & { planSlug: string }): Promise<{
        success: boolean;
        eventId: string;
        targetsCount: number;
        timestamp: number;
    }> {
        await this.initialize();

        try {
            const js = natsConfig.getJetStreamClient();

            const subject = `workspace.${data.workspaceId}.plan.${data.planSlug}.events.publish.${data.eventType?.toLowerCase() || 'unknown'}`;

            const event: IPublishedEvent = {
                eventId: data.eventId,
                workspaceId: data.workspaceId,
                namespaceId: data.namespaceId,
                sourceType: data.sourceType,
                eventType: data.eventType,
                timestamp: data.timestamp,

                data: data.payload,
                previous: data.previous ?? null,

                targets: data.targets,

                meta: data.meta,
            };

            const { signature, timestamp, nonce } = signatureCrypto.signMessage(
                JSON.stringify(event)
            );
            const message = { event, signature, timestamp, nonce };
            const publishResult = await js.publish(subject, JSON.stringify(message), {
                expect: {
                    streamName: 'EVENTS',
                },
            });
            logger.info(`Published receive event ${event.eventId} to JetStream`, {
                subject,
                stream: publishResult.stream,
                sequence: publishResult.seq,
            });
            // Store delivery tracking in Redis
            // await this.storeDeliveryTracking(events[0], data);

            return {
                success: true,
                eventId: data.eventId,
                targetsCount: data.targets.length,
                timestamp: data.timestamp,
            };
        } catch (error) {
            logger.error('Failed to send publish event to NATS', error as Error);
            publishQueues.publishQueue.add(publishQueuesName.retryPublishQueueName, data);
            return {
                success: false,
                eventId: data.eventId,
                targetsCount: data.targets.length,
                timestamp: data.timestamp,
            };
        }
    }

    /**
     * @title Batch Publish Events
     * @description Publishes multiple events to NATS JetStream with ACK support.
     * @param {BatchCreatePublishedEvent} data - The batch of events to publish.
     * @returns {Promise<Array<{ success: boolean; eventId: string; subject: string; stream: string; sequence: number; targetsCount: number; timestamp: number;} | null>>} The published events data.
     */
    public async batch(
        data: BatchCreatePublishedEvent,
        planSlug: string
    ): Promise<
        Array<{
            success: boolean;
            eventId: string;
            subject?: string;
            stream?: string;
            sequence?: number;
            targetsCount: number;
            timestamp: number;
            error?: string;
        } | null>
    > {
        await this.initialize();

        try {
            const js = natsConfig.getJetStreamClient();

            const limit = pLimit(20);
            const publishPromises = data.map(item =>
                limit(async () => {
                    try {
                        const subject = `workspace.${item.workspaceId}.plan.${planSlug}.events.publish.${item.eventType.toLowerCase()}`;

                        const event: Omit<IPublishedEvent, 'producerId' | 'userId'> = {
                            eventId: item.eventId,
                            workspaceId: item.workspaceId,
                            namespaceId: item.namespaceId,
                            sourceType: item.sourceType,
                            eventType: item.eventType,
                            timestamp: item.timestamp,

                            data: item.payload,
                            previous: item.previous ?? null,

                            targets: item.targets,

                            meta: item.meta,
                        };

                        const { signature, timestamp, nonce } = signatureCrypto.signMessage(
                            JSON.stringify(event)
                        );
                        const message = { event, signature, timestamp, nonce };

                        const publishResult = await js.publish(subject, JSON.stringify(message));

                        logger.info(`Published receive event ${item.event_id} to JetStream`, {
                            subject,
                            stream: publishResult.stream,
                            sequence: publishResult.seq,
                        });

                        // Store delivery tracking in Redis
                        // await this.storeDeliveryTracking(event, data);

                        return {
                            success: true,
                            eventId: item.eventId,
                            subject,
                            stream: publishResult.stream,
                            sequence: publishResult.seq,
                            targetsCount: item.targets.length,
                            timestamp: item.timestamp,
                        };
                    } catch (error: unknown) {
                        logger.error(
                            'Unexpected error in PublishEventPublisher.batch',
                            error as Error
                        );
                        publishQueues.publishQueue.add(
                            publishQueuesName.retryPublishQueueName,
                            item
                        );
                        return {
                            success: false,
                            eventId: item.eventId,
                            targetsCount: item.targets.length,
                            timestamp: item.timestamp,
                            error: error instanceof Error ? error.message : 'Unknown error',
                        };
                    }
                })
            );

            const returns = await Promise.all(publishPromises);
            return returns;
        } catch (error: unknown) {
            logger.error('Failed to send batch publish events to NATS', error as Error);
            return [null];
        }
    }

    /**
     * @title Store Delivery Tracking
     * @description Stores delivery tracking information in Redis for monitoring.
     * @param {Record<string, any>} event - The event record.
     * @param {IPublishedEvent} data - The event data.
     * @returns {Promise<void>} Resolves when tracking is stored.
     */
    private async storeDeliveryTracking(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        event: Record<string, any>,
        data: IPublishedEvent
    ): Promise<void> {
        try {
            const redisClient = redisConfig.getClient();

            for (const target of data.targets) {
                const targetKey = REDIS_KEYS.targetHash(
                    prefixId(event.event_id.toString(), 'event')!,
                    data.sourceType,
                    prefixId(target.targetId || '', 'target')!
                );

                await redisClient.hset(targetKey, {
                    deliveryId: `del_${snowflake.generate()}`,
                    workspaceId: prefixId(event.workspace_id?.toString() || '', 'workspace') || '',
                    sourceType: 'publish',
                    eventId: prefixId(event.event_id?.toString() || '', 'event') || '',
                    eventModel: 'PublishedEvent',
                    // sourceId: data.sourceId,
                    target: JSON.stringify({
                        id: target.targetId,
                        url: target.targetUrl,
                    }),
                    status: 'pending',
                    attemptNumber: 0,
                    requestHeader: '',
                    requestBody: '',
                    responseCode: 0,
                    responseHeader: '',
                    responseBody: '',
                    responseTimeMs: 0,
                    scheduledAt: data.meta.insertedAt.toISOString(),
                    processedAt: new Date().toISOString(),
                    error: '',
                });

                // Add to dirty set for synchronization
                await redisClient.zadd(REDIS_KEYS.dirtyZset, Date.now(), targetKey);
            }
        } catch (error: unknown) {
            logger.error('Failed to store delivery tracking:', error as Error);
            // Don't fail the entire operation for tracking errors
        }
    }

    /**
     * @title Get Publisher Health
     * @description Returns the health status of the NATS publisher.
     * @returns {Promise<{ status: string; details: Record<string, unknown> }>} Health status and details.
     */
    public async getHealth(): Promise<{
        status: string;
        details: Record<string, unknown>;
    }> {
        try {
            const natsHealth = await natsConfig.healthCheck();
            const isConnected = natsConfig.getConnectionStatus();

            return {
                status: isConnected ? 'healthy' : 'unhealthy',
                details: {
                    nats: natsHealth,
                    initialized: this.isInitialized,
                    timestamp: new Date().toISOString(),
                },
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                details: {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    timestamp: new Date().toISOString(),
                },
            };
        }
    }
}

/**
 * @title natsEventPublisher Singleton
 * @description Exported singleton instance for use throughout the application.
 */
export const publishEventPublisher = PublishEventPublisher.getInstance();
