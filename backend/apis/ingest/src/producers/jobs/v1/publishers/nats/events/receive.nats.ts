import { natsConfig } from '@/configs/nats';
import { config } from '@/configs';
import type { IReceivedEvent } from '@kyrazo/shared';
import { logger, signatureCrypto } from '@kyrazo/shared';
import { DiscardPolicy, RetentionPolicy, StorageType, StringCodec } from 'nats';

/**
 * @title ReceiveEventPublisher
 * @description Professional NATS JetStream-based event publisher with ACK support.
 * Replaces BullMQ with NATS JetStream for reliable event delivery.
 */
export class ReceiveEventPublisher {
    private static instance: ReceiveEventPublisher;
    private isInitialized = false;
    private sc = StringCodec();

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

            this.isInitialized = true;
            logger.info('NATS Event Publisher initialized successfully');
        } catch (error: any) {
            logger.error('Failed to initialize NATS Event Publisher in receive.nats.ts', error);
            throw error;
        }
    }

    /**
     * @title Receive Event
     * @description Publishes a received event to NATS JetStream for processing.
     * @param {IReceivedEvent & { shard?: number }} data - The received event data to publish.
     * @returns {Promise<{ success: boolean }>} The published event data.
     */
    public async receive(
        data: IReceivedEvent & { shard?: number; planSlug: string }
    ): Promise<{ success: boolean }> {
        await this.initialize();

        try {
            const js = natsConfig.getJetStreamClient();
            const subject = `workspace.${data.workspaceId}.plan.${data.planSlug}.events.receive.${data.source?.toLowerCase() || 'unknown'}`;

            const event: Omit<IReceivedEvent, 'processingStatus'> = {
                eventId: data.eventId,
                source: data.source,
                sourceType: 'receive',
                sourceId: data.sourceId,
                workspaceId: data.workspaceId,
                namespaceId: data.namespaceId,
                ingressId: data.ingressId,
                userId: data.userId,

                receivedAt: data.receivedAt,
                headers: data.headers,
                body: data.body,

                associatedEventId: data.associatedEventId,
            };

            const { signature, timestamp, nonce } = signatureCrypto.signMessage(
                JSON.stringify(event)
            );
            const message = { event, signature, timestamp, nonce };

            const publishResult = await js.publish(
                subject,
                this.sc.encode(JSON.stringify(message))
            );

            return { success: true };
        } catch (error: any) {
            logger.error('Failed to publish receive event to NATS', error);
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
        } catch (error: any) {
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
 * @title receiveEventPublisher Singleton
 * @description Exported singleton instance for use throughout the application.
 */
export const receiveEventPublisher = ReceiveEventPublisher.getInstance();
