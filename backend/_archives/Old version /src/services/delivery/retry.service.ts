import { Queue, Worker, Job } from 'bullmq';
import { randomUUID } from 'crypto';
import { EventEmitter } from 'events';
import { QUEUE_CONFIG } from '@/config/delivery/queue.config';
import { deliveryRepository } from '@/database/models/clickhouse/repositories/delivery.repo';
import { IRetryStats } from '@/types/delivery/retry.types';

/**
 * BullMQ-based Retry Service for Event Delivery
 * Uses BullMQ retry queue for handling failed deliveries with exponential backoff
 */
export class RetryService extends EventEmitter {
  private static instance: RetryService;
  private retryQueue: Queue;
  private retryWorker: Worker;
  private stats: IRetryStats = {
    totalRetries: 0,
    successfulRetries: 0,
    failedRetries: 0,
    averageRetryTime: 0,
    retrySuccessRate: 0
  };

  private constructor() {
    super();

    // Initialize retry queue
    this.retryQueue = new Queue(QUEUE_CONFIG.RETRY_QUEUE.name, {
      connection: QUEUE_CONFIG.RETRY_QUEUE.redis,
      defaultJobOptions: QUEUE_CONFIG.RETRY_QUEUE.defaultJobOptions,
    });

    // Initialize retry worker
    this.retryWorker = new Worker(
      QUEUE_CONFIG.RETRY_QUEUE.name,
      this.processRetryJob.bind(this),
      {
        connection: QUEUE_CONFIG.RETRY_QUEUE.redis,
        concurrency: QUEUE_CONFIG.RETRY_QUEUE.concurrency,
      }
    );

    this.setupEventListeners();
    console.log('🔄 BullMQ Retry Service initialized');
  }

  public static getInstance(): RetryService {
    if (!RetryService.instance) {
      RetryService.instance = new RetryService();
    }
    return RetryService.instance;
  }

  /**
   * Schedule a retry for a failed delivery using BullMQ
   */
  public async scheduleRetry(
    deliveryId: string,
    eventId: string,
    targetId: string,
    targetUrl: string,
    eventData: any,
    maxAttempts: number = 3,
    delayMs: number = 0
  ): Promise<string> {
    try {
      // Get current attempt number from delivery repository
      const deliveryAttempts = await deliveryRepository.getDeliveryAttemptsByEventId(eventId);
      const currentAttempt = deliveryAttempts.filter(attempt => attempt.deliveryId === deliveryId).length;

      if (currentAttempt >= maxAttempts) {
        console.log(`❌ Max retries (${maxAttempts}) exceeded for delivery: ${deliveryId}`);
        this.emit('retryExhausted', { deliveryId, eventId, targetId, maxAttempts });
        throw new Error(`Max retries (${maxAttempts}) already exceeded for delivery: ${deliveryId}`);
      }

      const nextAttemptNumber = currentAttempt + 1;

      const jobData = {
        deliveryId,
        eventId,
        targetId,
        targetUrl,
        eventData,
        attemptNumber: nextAttemptNumber,
        maxAttempts,
      };

      const job = await this.retryQueue.add('retry-delivery', jobData, {
        jobId: `${deliveryId}-retry-${nextAttemptNumber}`,
        priority: this.calculateRetryPriority(nextAttemptNumber, maxAttempts),
        delay: delayMs,
        attempts: 1, // Each retry job runs only once
      });

      console.log(`📅 Scheduled BullMQ retry ${nextAttemptNumber}/${maxAttempts} for delivery ${deliveryId} in ${delayMs}ms`);
      this.emit('retryScheduled', {
        deliveryId,
        attemptNumber: nextAttemptNumber,
        delayMs,
        maxAttempts,
        jobId: job.id
      });

      return job.id || `${deliveryId}-retry-${nextAttemptNumber}`;
    } catch (error) {
      console.error('❌ Error scheduling BullMQ retry:', error);
      throw error;
    }
  }

  /**
   * Process a single retry job using BullMQ
   */
  private async processRetryJob(job: Job): Promise<void> {
    const startTime = Date.now();
    const { deliveryId, eventId, targetId, targetUrl, eventData, attemptNumber, maxAttempts } = job.data;

    try {
      console.log(`🔄 Processing BullMQ retry job: ${job.id} (attempt: ${attemptNumber}/${maxAttempts})`);

      // Check if we've exceeded max retries
      if (attemptNumber > maxAttempts) {
        console.log(`❌ Max retries (${maxAttempts}) exceeded for delivery: ${deliveryId}`);
        await this.markDeliveryAsPermanentlyFailed(deliveryId, 'Max retries exceeded', startTime);
        this.emit('maxRetriesExceeded', { deliveryId, attemptNumber, maxAttempts });
        throw new Error(`Max retries (${maxAttempts}) exceeded for delivery: ${deliveryId}`);
      }

      // Send HTTP request with retry headers - only 1 attempt per retry job
      const retryHeaders = {
        'Content-Type': 'application/json',
        'User-Agent': 'Hookify-Worker/1.0',
        'X-Event-ID': eventId,
        'X-Delivery-ID': deliveryId,
        'X-Retry-Attempt': attemptNumber.toString(),
      };

      const response = await this.sendHttpRequest(targetUrl, eventData, retryHeaders);

      // Update delivery attempt record as successful
      await deliveryRepository.updateDeliveryAttempt(deliveryId, {
        status: 'delivered',
        responseCode: response.statusCode,
        responseBody: JSON.stringify(response.body),
        responseTimeMs: Date.now() - startTime,
        processedAt: new Date(),
      });

      const processingTime = Date.now() - startTime;
      this.updateStats(true, processingTime);

      console.log(`✅ BullMQ retry successful: ${job.id} (${response.statusCode})`);
      this.emit('retrySuccess', {
        deliveryId,
        attemptNumber,
        processingTime,
        statusCode: response.statusCode,
        jobId: job.id
      });

    } catch (error: any) {
      const processingTime = Date.now() - startTime;

      console.error(`❌ BullMQ retry failed: ${job.id}`, error.message);

      // Check if we should retry again
      if (attemptNumber < maxAttempts && this.isRetryableError(error)) {
        const nextAttempt = attemptNumber + 1;
        const delayMs = this.calculateRetryDelay(nextAttempt);

        await this.scheduleRetry(
          deliveryId,
          eventId,
          targetId,
          targetUrl,
          eventData,
          maxAttempts,
          delayMs
        );
      } else {
        // Max retries exceeded or non-retryable error
        await this.markDeliveryAsPermanentlyFailed(deliveryId, error.message, startTime);
        this.updateStats(false, processingTime);

        this.emit('retryFailed', {
          deliveryId,
          attemptNumber,
          error: error.message,
          processingTime,
          jobId: job.id
        });

        // Throw error to mark job as failed in BullMQ
        throw error;
      }
    }
  }

  /**
   * Mark delivery as permanently failed
   */
  private async markDeliveryAsPermanentlyFailed(deliveryId: string, errorMessage: string, startTime: number): Promise<void> {
    await deliveryRepository.updateDeliveryAttempt(deliveryId, {
      status: 'failed',
      responseCode: 0,
      responseBody: errorMessage,
      responseTimeMs: Date.now() - startTime,
      processedAt: new Date(),
    });
  }

  /**
   * Send HTTP request using got
   */
  private async sendHttpRequest(
    url: string,
    data: any,
    headers: Record<string, string>
  ): Promise<{ statusCode: number; body: any }> {
    const got = await import('got');

    const response = await got.default.post(url, {
      json: data,
      headers,
      timeout: { request: 30000 },
      // No retries - we handle them via BullMQ
    });

    return {
      statusCode: response.statusCode,
      body: response.body,
    };
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

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attemptNumber: number): number {
    const baseDelay = 2000; // 2 seconds
    const maxDelay = 60000; // 1 minute
    const delay = baseDelay * Math.pow(2, attemptNumber - 1);

    return Math.min(delay, maxDelay);
  }

  /**
   * Calculate priority for retry jobs
   */
  private calculateRetryPriority(attemptNumber: number, maxAttempts: number): number {
    // Higher priority for fewer remaining attempts
    const remainingAttempts = maxAttempts - attemptNumber + 1;
    return Math.max(remainingAttempts * 10, 1);
  }

  /**
   * Update retry statistics
   */
  private updateStats(success: boolean, processingTime: number): void {
    this.stats.totalRetries++;

    if (success) {
      this.stats.successfulRetries++;
    } else {
      this.stats.failedRetries++;
    }

    // Update average retry time
    const totalTime = this.stats.averageRetryTime * (this.stats.totalRetries - 1) + processingTime;
    this.stats.averageRetryTime = totalTime / this.stats.totalRetries;

    // Update success rate
    this.stats.retrySuccessRate = (this.stats.successfulRetries / this.stats.totalRetries) * 100;
  }

  /**
   * Setup event listeners for monitoring
   */
  private setupEventListeners(): void {
    this.retryWorker.on('completed', (job: Job) => {
      if (job) {
        console.log(`✅ BullMQ retry job completed: ${job.id}`);
      }
    });

    this.retryWorker.on('failed', (job: Job | undefined, err: Error) => {
      if (job) {
        console.error(`❌ BullMQ retry job failed: ${job.id}`, err.message);
      }
    });
  }

  /**
   * Get retry statistics
   */
  public getStats(): IRetryStats {
    return { ...this.stats };
  }

  /**
   * Get retry queue size
   */
  public async getQueueSize(): Promise<number> {
    const counts = await this.retryQueue.getJobCounts();
    return counts.waiting + counts.active + counts.delayed;
  }

  /**
   * Clear retry queue
   */
  public async clearQueue(): Promise<void> {
    await this.retryQueue.drain();
    console.log('🗑️ BullMQ retry queue cleared');
  }

  /**
   * Force process retry queue immediately
   */
  public async forceProcessQueue(): Promise<void> {
    console.log('🚀 Force processing BullMQ retry queue...');

    // Promote all delayed jobs to waiting
    const delayedJobs = await this.retryQueue.getDelayed();
    for (const job of delayedJobs) {
      await job.promote();
    }

    console.log(`✅ Promoted ${delayedJobs.length} delayed retry jobs`);
  }

  /**
   * Gracefully shutdown retry service
   */
  public async shutdown(): Promise<void> {
    console.log('🔄 Shutting down BullMQ retry service...');

    try {
      await this.retryWorker.close();
      await this.retryQueue.close();
      console.log('✅ BullMQ retry service shutdown complete');
    } catch (error) {
      console.error('❌ Error shutting down BullMQ retry service:', error);
      throw error;
    }
  }
}

export const retryService = RetryService.getInstance();