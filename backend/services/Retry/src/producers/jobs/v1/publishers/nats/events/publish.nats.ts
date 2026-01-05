import { v4 as uuidv4 } from 'uuid';
import pLimit from 'p-limit';

import { natsConfig } from '@/configs/nats';
import { redisConfig, REDIS_KEYS } from '@/configs/redis';
import { config, logger } from '@/configs';
import { IPublishedEvent } from '@/types';
import { signatureCrypto } from '@/utils/libs/crypto';
import { BatchCreatePublishedEvent, CreatePublishedEvent } from '@/utils/libs/zod';
import { retryQueues, retryQueuesName } from '@/producers/jobs/v1/publishers';

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

            await this.ensureJetStreamSetup();

            this.isInitialized = true;
            logger.info('NATS Event Publisher initialized successfully');
        } catch (error: unknown) {
            logger.error('Failed to initialize NATS Event Publisher in publish.nats.ts ', error as Error);
            throw error;
        }
    }

    /**
     * @title Ensure JetStream Setup
     * @description Creates JetStream stream and consumer if they don't exist.
     * @returns {Promise<void>} Resolves when setup is complete.
     */
    private async ensureJetStreamSetup(): Promise<void> {
        try {
            const jsm = natsConfig.getJetStreamManager();

            try {
                await jsm.streams.add({
                    name: config.nats.consumer.stream,
                    subjects: ['webhooks.>'],
                });
                logger.info('Created EVENTS JetStream stream');
            } catch (error: unknown) {
                const errorMessage =
                    error instanceof Error ? error.message : 'Unknown error';
                if (!errorMessage.includes('already exists')) {
                    throw error;
                }
                logger.debug('WEBHOOKS stream already exists');
            }
        } catch (error: unknown) {
            logger.error('Failed to setup JetStream in publish.nats.ts', error as Error);
            throw error;
        }
    }

    /**
     * @title Publish Event
     * @description Publishes an event to NATS JetStream with ACK support.
     * @param {Omit<IPublishedEvent, 'producerId'>} data - The event data to publish.
     * @returns {Promise<{ success: boolean; eventId: string; subject: string; stream: string; sequence: number; targetsCount: number; timestamp: number;} | null>} The published event data.
     */
    public async publish(data: CreatePublishedEvent): Promise<{
        success: boolean;
        eventId: string;
        subject: string;
        stream: string;
        sequence: number;
        targetsCount: number;
        timestamp: number;
    } | null> {
        await this.initialize();

        try {
            const js = natsConfig.getJetStreamClient();
            const subject = `webhooks.publish.${data.eventType.toLowerCase()}`;

            const event: Omit<IPublishedEvent, 'producerId' | 'userId'> = {
                eventId: data.eventId,
                workspaceId: data.workspaceId,
                webhookId: data.webhookId,
                webhookType: data.webhookType,
                eventType: data.eventType,
                timestamp: data.timestamp,

                data: data.payload,

                targets: data.targets,

                meta: data.meta,
            };

            const { signature, timestamp, nonce } = signatureCrypto.signMessage(
                JSON.stringify(event),
                config.security.encryptions.key!
            );
            const message = { event, signature, timestamp, nonce };

            const publishResult = await js.publish(
                subject,
                JSON.stringify(message)
            );

            logger.info(
                `Published event ${data.eventId} to JetStream ` +
                    JSON.stringify({
                        subject,
                        stream: publishResult.stream,
                        sequence: publishResult.seq,
                        targets: data.targets.length,
                    })
            );

            // Store delivery tracking in Redis
            // await this.storeDeliveryTracking(events[0], data);

            return {
                success: true,
                eventId: data.eventId,
                subject,
                stream: publishResult.stream,
                sequence: publishResult.seq,
                targetsCount: data.targets.length,
                timestamp: data.timestamp,
            };
        } catch (error) {
            logger.error(
                'Failed to send publish event to NATS',
                error as Error
            );
            retryQueues.publishQueue.add(
                        retryQueuesName.publishQueueName,
                        data
                    )
            return null;
        }
    }

    /**
     * @title Publish Event
     * @description Publishes an event to NATS JetStream with ACK support.
     * @param {Omit<IPublishedEvent, 'producerId'>} data - The event data to publish.
     * @returns {Promise<{ success: boolean; eventId: string; subject: string; stream: string; sequence: number; targetsCount: number; timestamp: number;} | null>} The published event data.
     */
    public async batch(data: BatchCreatePublishedEvent): Promise<
        Array<{
            success: boolean;
            eventId: string;
            subject: string;
            stream: string;
            sequence: number;
            targetsCount: number;
            timestamp: number;
        } | null>
    > {
        await this.initialize();

        try {
            const js = natsConfig.getJetStreamClient();

            const limit = pLimit(20);
            const publishPromises = data.map(item => 
                limit(async () => {
                try {
                    const subject = `webhooks.publish.${item.eventType.toLowerCase()}`;
    
                    const event: Omit<
                        IPublishedEvent,
                        'producerId' | 'userId'
                    > = {
                        eventId: item.eventId,
                        workspaceId: item.workspaceId,
                        webhookId: item.webhookId,
                        webhookType: item.webhookType,
                        eventType: item.eventType,
                        timestamp: item.timestamp,
    
                        data: item.payload,
    
                        targets: item.targets,
    
                        meta: item.meta,
                    };
    
                    const { signature, timestamp, nonce } = signatureCrypto.signMessage(
                        JSON.stringify(event),
                        config.security.encryptions.key!
                    );
                    const message = { event, signature, timestamp, nonce };
    
                    const publishResult = await js.publish(
                        subject,
                        JSON.stringify(message)
                    );
    
                    logger.info(
                        `Published event ${item.eventId} to JetStream ` +
                            JSON.stringify({
                                subject,
                                stream: publishResult.stream,
                                sequence: publishResult.seq,
                                targets: item.targets.length,
                            })
                    );
    
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
                    retryQueues.publishQueue.add(
                        retryQueuesName.publishQueueName,
                        item
                    )
                    return null;
                }
            }));
            // for (let index = 0; index < data.length; index++) {
            // }

            const returns = await Promise.all(publishPromises);
            return returns;
        } catch (error: unknown) {
            logger.error(
                'Failed to send batch publish events to NATS',
                error as Error
            );
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
                    event.event_id.toString(),
                    data.webhookType,
                    target.targetId || ''
                );

                await redisClient.hSet(targetKey, {
                    deliveryId: `del_${uuidv4()}`,
                    workspaceId: event.workspace_id?.toString() || '',
                    producerId: data.producerId || 'nats-publisher',
                    webhookType: 'publish',
                    eventId: event.event_id?.toString() || '',
                    eventModel: 'PublishedEvent',
                    webhookId: data.webhookId,
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
                await redisClient.zAdd(REDIS_KEYS.dirtyZset, {
                    score: Date.now(),
                    value: targetKey,
                });
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
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Unknown error',
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
