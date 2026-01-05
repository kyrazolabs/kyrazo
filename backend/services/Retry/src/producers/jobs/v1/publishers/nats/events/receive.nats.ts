import { natsConfig } from '@/configs/nats';
import { config, logger } from '@/configs';
import {
    IReceivedEvent,
} from '@/types';
import { signatureCrypto } from '@/utils/libs/crypto';

/**
 * @title ReceiveEventPublisher
 * @description Professional NATS JetStream-based event publisher with ACK support.
 * Replaces BullMQ with NATS JetStream for reliable event delivery.
 */
export class ReceiveEventPublisher {
    private static instance: ReceiveEventPublisher;
    private isInitialized = false;

    /**
     * @title ReceiveEventPublisher Constructor
     * @description Private constructor to enforce singleton pattern.
     */
    private constructor() {}

    /**
     * @title Get ReceiveEventPublisher Instance
     * @description Returns the singleton instance of ReceiveEventPublisher.
     * @returns {ReceiveEventPublisher} The singleton instance.
     */
    public static getInstance(): ReceiveEventPublisher {
        if (!ReceiveEventPublisher.instance) {
            ReceiveEventPublisher.instance = new ReceiveEventPublisher();
        }
        return ReceiveEventPublisher.instance;
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
            logger.error('Failed to initialize NATS Event Publisher in receive.nats.ts', error as Error);
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
            // const js = natsConfig.getJetStreamClient();

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
            logger.error('Failed to setup JetStream in receive.nats.ts', error as Error);
            throw error;
        }
    }

    /**
     * @title Receive Event
     * @description Publishes a received event to NATS JetStream for processing.
     * @param {Omit<IReceivedEvent, 'producerId'>} data - The received event data to publish.
     * @returns {Promise<{ success: boolean }>} The published event data.
     */
    public async receive(
        data: Omit<IReceivedEvent, 'producerId'>
    ): Promise<{ success: boolean }> {
        await this.initialize();

        try {
            const js = natsConfig.getJetStreamClient();
            const subject = `webhooks.receive.${data.source?.toLowerCase() || 'unknown'}`;

            const event: Omit<IReceivedEvent, 'producerId'> = {
                eventId: data.eventId,
                source: data.source,
                webhookType: 'receive',
                webhookId: data.webhookId,
                workspaceId: data.workspaceId,
                ingressId: data.ingressId,
                userId: data.userId,

                receivedAt: data.receivedAt,
                headers: data.headers,
                body: data.body,

                processingStatus: data.processingStatus,
                associatedEventId: data.associatedEventId,

                forwarding: data.forwarding,
                endpoints: data.endpoints,
            };

            const { signature, timestamp, nonce } = signatureCrypto.signMessage(
                JSON.stringify(event),
                config.security.encryptions.key!
            );
            const message = { event, signature, timestamp, nonce };

            logger.debug(JSON.stringify(message));

            const publishResult = await js.publish(
                subject,
                JSON.stringify(message)
            );

            logger.info(
                `Published receive event ${data.eventId} to JetStream`,
                {
                    subject,
                    stream: publishResult.stream,
                    sequence: publishResult.seq,
                }
            );

            return { success: true };
        } catch (error: unknown) {
            logger.error('Failed to publish receive event to NATS', error as Error);
            throw error;
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
 * @title receiveEventPublisher Singleton
 * @description Exported singleton instance for use throughout the application.
 */
export const receiveEventPublisher = ReceiveEventPublisher.getInstance();
