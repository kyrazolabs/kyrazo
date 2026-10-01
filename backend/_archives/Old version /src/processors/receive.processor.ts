import { IReceivedEvent, ProcessingStatus } from '@/types/events/event.types';
import { receivedEventRepository } from '@/database/models/clickhouse/repositories/received.repo';
import { SignatureGenerator } from '@/services/transformers/signature.generator';
import { Webhook } from '@/database/models/mongodb/Webhook';
import { logger } from '@/utils';

/**
 * @title Receive Event Processor
 * @description Processes received events with validation and storage
 */
export class ReceiveProcessor {
  private static instance: ReceiveProcessor;

  private constructor() {}

  public static getInstance(): ReceiveProcessor {
    if (!ReceiveProcessor.instance) {
      ReceiveProcessor.instance = new ReceiveProcessor();
    }
    return ReceiveProcessor.instance;
  }

  /**
   * Process a received event
   */
  public async processEvent(event: any): Promise<void> {
    try {
      logger.debug(`🔄 Processing received event: ${event.eventId}`);

      // 1. Validate webhook exists and is active
      const webhook = await this.validateWebhook(event.webhookId);

      // 2. Verify signature using Hookster headers
      const isValid = this.verifyHooksterSignature(event, webhook.secret);

      // 3. Transform and store event
      await this.storeReceivedEvent(event, isValid);

      logger.debug(`✅ Received event processed: ${event.eventId} (verified: ${isValid})`);
    } catch (error) {
      logger.error(`❌ Error processing received event ${event.eventId}:`, error);
      throw error;
    }
  }

  /**
   * Validate webhook exists and is active
   */
  private async validateWebhook(webhookId: string): Promise<any> {
    const webhook = await Webhook.findById(webhookId);
    if (!webhook) {
      throw new Error(`Webhook not found: ${webhookId}`);
    }
    if (!webhook.isEnabled) {
      throw new Error(`Webhook is disabled: ${webhookId}`);
    }
    if (webhook.status !== 'active') {
      throw new Error(`Webhook is not active: ${webhookId}`);
    }
    return webhook;
  }

  /**
   * Verify Hookster signature from headers
   */
  private verifyHooksterSignature(event: any, webhookSecret: string): boolean {
    try {
      const { headers, body, eventId, eventType, timestamp } = event;

      // Extract Hookster headers
      const signature = headers['x-hookster-signature'];
      const eventIdHeader = headers['x-hookster-id'];
      const eventTypeHeader = headers['x-hookster-event'];
      const timestampHeader = headers['x-hookster-timestamp'];

      if (!signature || !eventIdHeader || !eventTypeHeader || !timestampHeader) {
        logger.warn(`Missing required Hookster headers for event: ${eventId}`);
        return false;
      }

      // Verify event ID matches
      if (eventIdHeader !== eventId) {
        logger.warn(`Event ID mismatch: header=${eventIdHeader}, data=${eventId}`);
        return false;
      }

      // Verify event type matches
      if (eventTypeHeader !== eventType) {
        logger.warn(`Event type mismatch: header=${eventTypeHeader}, data=${eventType}`);
        return false;
      }

      // Generate expected signature
      const payload = JSON.stringify(body);
      const signatureGenerator = SignatureGenerator.getInstance();
      const expectedSignature = signatureGenerator.generateWebhookSignature(
        payload,
        webhookSecret,
        parseInt(timestampHeader)
      );

      // Compare signatures
      const isValid = signature === expectedSignature;

      if (!isValid) {
        logger.warn(`Invalid signature for event: ${eventId}`);
      }

      return isValid;
    } catch (error) {
      logger.error(`Error verifying signature for event ${event.eventId}:`, error);
      return false;
    }
  }

  /**
   * Store received event in database
   */
  private async storeReceivedEvent(event: any, isVerified: boolean): Promise<void> {
    const receivedEvent: IReceivedEvent = {
      eventId: event.eventId,
      source: event.source || 'external',
      workspaceId: event.workspaceId,
      webhookId: event.webhookId,
      ingressId: event.ingressId || `ingress_${Date.now()}`,
      userId: event.userId,

      receivedAt: new Date(),
      headers: this.convertHeadersToMap(event.headers),
      body: event.body,
      processingStatus: isVerified ? ProcessingStatus.PROCESSED : ProcessingStatus.FAILED,
      verified: isVerified,
      processingError: isVerified ? undefined : 'Signature verification failed',

      routeTo: event.routeTo,
      routeToMeta: event.routeToMeta,
    };

    await receivedEventRepository.saveReceivedEvent(receivedEvent);

    logger.debug(`💾 Stored received event: ${event.eventId} (verified: ${isVerified})`);
  }

  /**
   * Convert headers object to Map for storage
   */
  private convertHeadersToMap(headers: Record<string, string>): Map<string, string> {
    const headerMap = new Map<string, string>();

    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        headerMap.set(key.toLowerCase(), String(value));
      });
    }

    return headerMap;
  }
}

export const receiveProcessor = ReceiveProcessor.getInstance();