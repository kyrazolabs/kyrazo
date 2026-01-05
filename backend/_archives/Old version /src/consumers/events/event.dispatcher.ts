import { randomUUID } from 'crypto';
// import got from 'got';
// import { targetRepository } from '@/database/models/clickhouse/repositories/target.repo';
// import { deliveryRepository } from '@/database/models/clickhouse/repositories/delivery.repo';
// import { retryService } from '@/services/delivery/retry.service';
import { dispatchQueueService } from '@/services/delivery/dispatch.queue.service';
// import { ITarget, IDeliveryAttempt } from '@/types/services';
// import { RETRY_CONFIGS, RETRYABLE_STATUS_CODES, RETRYABLE_ERRORS } from '@/constants/delivery/retry.constants';
import { JOB_PRIORITIES } from '@/config/delivery/queue.config';

/**
 * Event Dispatcher
 * Handles the actual delivery of events to target URLs
 */
export class EventDispatcher {
  private static instance: EventDispatcher;

  private constructor() {}

  public static getInstance(): EventDispatcher {
    if (!EventDispatcher.instance) {
      EventDispatcher.instance = new EventDispatcher();
    }
    return EventDispatcher.instance;
  }

  /**
   * Dispatch event to all targets using BullMQ queue
   */
  public async dispatchToTargets(
    event: any,
    webhookId: string,
    targets: any[]
  ): Promise<void> {
    try {
      console.log(`📦 Dispatching event ${event.eventId} to ${targets.length} targets via queue`);

      if (!targets || targets.length === 0) {
        console.log('No targets provided in event');
        return;
      }

      // Add each target to the dispatch queue
      const queuePromises = targets.map(async (target) => {
        const priority = this.calculatePriority(event, target);

        return await dispatchQueueService.addToQueue(
          event.eventId,
          webhookId,
          target.targetId || `target_${Date.now()}`,
          target.targetUrl,
          event, // Pass the full event object so queue can access meta.maxRetries
          {
            'Content-Type': 'application/json',
            'User-Agent': 'Hookify-Worker/1.0',
            'X-Event-ID': event.eventId,
            'X-Delivery-ID': `del_${randomUUID()}`,
          },
          priority
        );
      });

      // Wait for all jobs to be queued
      const jobIds = await Promise.all(queuePromises);

      console.log(`✅ Queued ${jobIds.length} dispatch jobs for event ${event.eventId}`);

    } catch (error) {
      console.error('Error dispatching to targets via queue:', error);
      throw error;
    }
  }

  /**
   * Calculate priority for dispatch job based on event and target
   */
  private calculatePriority(event: any, target: any): number {
    // High priority for critical events
    if (event.meta?.priority === 'urgent' || event.meta?.priority === 'high') {
      return JOB_PRIORITIES.CRITICAL;
    }

    // Normal priority for standard events
    if (event.meta?.priority === 'normal') {
      return JOB_PRIORITIES.NORMAL;
    }

    // Low priority for low priority events
    return JOB_PRIORITIES.LOW;
  }

  /**
   * Dispatch event to a specific target from event (legacy method - kept for compatibility)
   */
  /** private async dispatchToTargetFromEvent(event: any, target: any): Promise<void> {
    const deliveryId = `del_${randomUUID()}`;

    try {
      console.log(`🚀 Delivering to target: ${target.targetUrl}`);

      // Create delivery attempt record
      const deliveryAttempt: IDeliveryAttempt = {
        deliveryId,
        targetId: target.targetId || `target_${Date.now()}`,
        eventId: event.eventId,
        status: 'pending',
        attemptNumber: 1,
        scheduledAt: new Date(),
        requestBody: JSON.stringify(event.data),
        requestHeaders: {
          'Content-Type': 'application/json',
          'User-Agent': 'Hookify-Worker/1.0',
          'X-Event-ID': event.eventId,
          'X-Delivery-ID': deliveryId
        }
      };

      await deliveryRepository.createDeliveryAttempt(deliveryAttempt);

      // Update status to processing
      await deliveryRepository.updateDeliveryAttempt(deliveryId, {
        status: 'processing',
        processedAt: new Date()
      });

      // Send HTTP request to target URL - NOW WITH REAL HTTP!
      const response = await this.sendRealHttpRequest(target.targetUrl, event.data, deliveryAttempt.requestHeaders || {});

      // Mark as successful
      await deliveryRepository.markDeliverySuccess(deliveryId, response.statusCode, JSON.stringify(response.body));

      console.log(`✅ Successfully delivered to ${target.targetUrl} (${response.statusCode})`);

    } catch (error: any) {
      console.error(`❌ Failed to deliver to ${target.targetUrl}:`, error.message);

      // Mark as failed
      await deliveryRepository.markDeliveryFailed(deliveryId, error.message, 1);

      // Schedule retry if it's a retryable error
      if (this.isRetryableError(error)) {
        console.log(`📅 Scheduling retry for failed delivery: ${deliveryId}`);
        // Use BullMQ retry service with maxRetries from event meta
        const maxRetries = event.meta?.maxRetries || 3;
        await retryService.scheduleRetry(
          deliveryId,
          event.eventId,
          target.targetId || 'unknown',
          target.targetUrl,
          event,
          maxRetries,
          0 // Process immediately
        );
      } else {
        console.log(`❌ Non-retryable error for delivery: ${deliveryId}`);
      }
    }
  } */

  /**
   * Send real HTTP request to target URL
   */ 
  
  /** private async sendRealHttpRequest(
    url: string,
    data: any,
    headers: Record<string, string>
  ): Promise<{ statusCode: number; body: any }> {
    try {
      console.log(`🚀 Sending HTTP POST to: ${url}`);
      console.log('📦 Payload:', JSON.stringify(data, null, 2));

      const response = await got.post(url, {
        json: data,
        headers,
        timeout: {
          request: 30000, // 30 seconds
        },
        retry: {
          limit: 0, // We handle retries ourselves
        } as any,
      });

      console.log(`📨 Response: ${response.statusCode}`);

      return {
        statusCode: response.statusCode,
        body: response.body
      };

    } catch (error: any) {
      console.error('❌ HTTP request failed:', error.message);
      throw error;
    }
  } */

  /**
   * Retry failed deliveries
   */
  /** public async retryFailedDeliveries(): Promise<void> {
    try {
      console.log('Checking for failed deliveries to retry...');

      const failedAttempts = await deliveryRepository.getFailedAttemptsForRetry(3);

      if (failedAttempts.length === 0) {
        console.log('No failed deliveries to retry');
        return;
      }

      console.log(`Retrying ${failedAttempts.length} failed deliveries`);

      for (const attempt of failedAttempts) {
        // TODO: Implement retry logic with exponential backoff
        console.log(`Retrying delivery: ${attempt.deliveryId}`);
      }

    } catch (error) {
      console.error('Error retrying failed deliveries:', error);
    }
  } */

  /**
   * Check if an error should trigger a retry
   */
  /** private isRetryableError(error: any): boolean {
    // Check HTTP status codes
    if (error.response?.statusCode && !RETRYABLE_STATUS_CODES.includes(error.response.statusCode)) {
      return false;
    }

    // Check error types
    if (error.code && !RETRYABLE_ERRORS.includes(error.code)) {
      return false;
    }

    // Check error messages for non-retryable errors
    const errorMessage = error.message?.toLowerCase() || '';
    if (errorMessage.includes('unauthorized') || errorMessage.includes('forbidden') || errorMessage.includes('not found')) {
      return false;
    }

    return true;
  } */
}

export const eventDispatcher = EventDispatcher.getInstance();