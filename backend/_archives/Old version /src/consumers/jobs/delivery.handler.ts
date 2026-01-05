import { Job } from 'bullmq';
import { httpClient, logger } from '@/utils';
import { deliveryRepository } from '@/database/models/clickhouse/repositories/delivery.repo';
import { IDispatchJobData } from '@/types/delivery/queue.types';

/**
 * Delivery Handler - Processes individual delivery jobs
 * Handles the actual HTTP delivery and response processing
 */
export class DeliveryHandler {
  private static instance: DeliveryHandler;

  public static getInstance(): DeliveryHandler {
    if (!DeliveryHandler.instance) {
      DeliveryHandler.instance = new DeliveryHandler();
    }
    return DeliveryHandler.instance;
  }

  /**
   * Process a single delivery job
   */
  public async processDelivery(job: Job<IDispatchJobData>): Promise<void> {
    const startTime = Date.now();
    const { eventId, webhookId, targetId, targetUrl, eventData, headers, deliveryId, attemptNumber } = job.data;

    // eventData is the full event object
    const event = eventData;

    try {
      logger.debug(`🚀 Processing delivery job: ${job.id} for target: ${targetUrl} (attempt: ${attemptNumber}/${job.opts.attempts})`);

      // Create delivery attempt record
      const deliveryAttempt = {
        deliveryId,
        targetId,
        eventId,
        status: 'pending' as const,
        attemptNumber,
        scheduledAt: new Date(),
        requestBody: JSON.stringify(event),
        requestHeaders: headers,
        // Add missing fields that ClickHouse expects
        webhookId: webhookId,
        target: targetUrl, // Use targetUrl as the target field
        workspaceId: event.workspaceId || 'default', // Get from event data
        producerId: event.producerId || 'worker-delivery-handler', // Get from event or use default
        webhookType: event.webhookType || 'publish', // Get from event data
      };

      await deliveryRepository.createDeliveryAttempt(deliveryAttempt);

      // Update status to processing
      await deliveryRepository.updateDeliveryAttempt(deliveryId, {
        status: 'processing',
        processedAt: new Date(),
      });

      // Send HTTP request - only 1 attempt per job execution
      const response = await httpClient.post(targetUrl, event, headers);

      // Mark as successful
      await deliveryRepository.markDeliverySuccess(deliveryId, response.statusCode, JSON.stringify(response.body));

      const processingTime = Date.now() - startTime;

      logger.debug(`✅ Delivery job completed: ${job.id} (${response.statusCode})`);
      this.emitSuccess({ jobId: job.id, deliveryId, statusCode: response.statusCode, attemptNumber, processingTime });

    } catch (error: any) {
      const processingTime = Date.now() - startTime;

      logger.error(`❌ Delivery job failed: ${job.id} (attempt ${attemptNumber}/${job.opts.attempts})`, error.message);

      // Mark as failed
      await deliveryRepository.markDeliveryFailed(deliveryId, error.message, attemptNumber);

      // Check if this was the last attempt
      const maxAttempts = job.opts.attempts || 3;
      if (attemptNumber >= maxAttempts) {
        logger.debug(`❌ Max attempts (${maxAttempts}) reached for delivery: ${deliveryId}`);
        this.emitMaxAttemptsReached({ jobId: job.id, deliveryId, attemptNumber, maxAttempts });
      } else {
        logger.debug(`📅 BullMQ will retry job ${job.id} (attempt ${attemptNumber + 1}/${maxAttempts})`);
        this.emitRetryScheduled({ jobId: job.id, deliveryId, nextAttempt: attemptNumber + 1, maxAttempts });
      }

      this.emitFailure({ jobId: job.id, deliveryId, error: error.message, attemptNumber, processingTime });

      // Throw error to trigger BullMQ retry (only if not max attempts)
      if (attemptNumber < maxAttempts) {
        throw error;
      }
      // If max attempts reached, don't throw - job will be marked as failed
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    // HTTP status codes that should trigger retry
    const retryableStatusCodes = [408, 429, 500, 502, 503, 504, 509];

    if (error.response?.statusCode && retryableStatusCodes.includes(error.response.statusCode)) {
      return true;
    }

    // Network errors that should trigger retry
    const retryableErrors = ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN'];

    if (error.code && retryableErrors.includes(error.code)) {
      return true;
    }

    // Check error messages
    const errorMessage = error.message?.toLowerCase() || '';
    if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
      return true;
    }

    return false;
  }

  // Event emitters for external monitoring
  private emitSuccess(data: any) {
    // TODO: External listeners can be attached via EventEmitter
  }

  private emitFailure(data: any) {
    // TODO: External listeners can be attached via EventEmitter
  }

  private emitMaxAttemptsReached(data: any) {
    // TODO: External listeners can be attached via EventEmitter
  }

  private emitRetryScheduled(data: any) {
    // TODO: External listeners can be attached via EventEmitter
  }
}

export const deliveryHandler = DeliveryHandler.getInstance();