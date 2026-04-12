import { EventEmitter } from 'events';
import { Worker, Job, QueueEvents, Queue } from 'bullmq';
import { redisConfig } from '@/config';
import { DeliveryStatus, logger, type SQLDeliveryAttempt, snowflake } from '@kyrazo/shared';
import type {
    IConfiguredTarget,
    IDispatchedEvent,
    IDispatchJobData,
    IWebhookHeaders,
} from '@/core/dispatcher/dispatcher.types';
import { httpRequester } from '@/services/http/http.requester';
import { dispatchProducer } from '../batch/dispatch.producer';
import { env } from '@/app/worker.env';
import { dispatcherSignature } from '@/core/dispatcher/dispatcher.signature';
import { dispatchAnalyticsProducer } from '@/services/analytics/dispatch.producer';
import { sandboxExecutor } from '@/services/sandbox/sandbox.executor';

/**
 * Backoff schedule for webhook delivery retries
 * 1m → 10m → 30m → 1h → 4h → 12h → 24h (max)
 */
const STEPPED_BACKOFF = [
    60000, // 1m
    600000, // 10m
    1800000, // 30m
    3600000, // 1h
    14400000, // 4h
    43200000, // 12h
    86400000, // 24h
];

/**
 * Event Processor - Coordinates event processing and queue management
 * Manages the overall event processing workflow and queue lifecycle
 */
export class DispatchConsumer extends EventEmitter {
    private static instance: DispatchConsumer;
    private dispatchWorker: Worker | undefined;
    private queueEvents: QueueEvents | undefined;
    private dispatchQueue: Queue | undefined;

    private constructor() {
        super();
    }

    public async initialize(): Promise<void> {
        if (this.dispatchWorker) return;

        logger.info('Initializing Dispatch Consumer...');
        const connection = redisConfig.getQueueClient();

        // Initialize workers
        this.dispatchWorker = new Worker(`{event-dispatch}`, this.process.bind(this), {
            connection,
            concurrency: env.worker.CONCURRENCY,
            settings: {
                backoffStrategy: (attemptsMade: number, type?: string) => {
                    if (type === 'stepped') {
                        const index = Math.min(attemptsMade - 1, STEPPED_BACKOFF.length - 1);
                        const baseDelay = STEPPED_BACKOFF[index] ?? 60000;

                        // Add ±20% jitter (e.g., 10m becomes 8m-12m)
                        const jitter = 0.8 + Math.random() * 0.4;
                        return Math.floor(baseDelay * jitter);
                    }

                    if (type === 'exponential') {
                        // Standard BullMQ exponential formula (2s base)
                        return Math.round(2000 * Math.pow(2, attemptsMade - 1));
                    }

                    // Fallback to 1 second
                    return 1000;
                },
            },
        });

        // Initialize queues
        this.dispatchQueue = new Queue(`{event-dispatch}`, {
            connection,
        });

        // Initialize queue events for monitoring
        this.queueEvents = new QueueEvents(`{event-dispatch}`, {
            connection,
        });

        this.setupEventListeners();
        logger.info('🚀 Event Processor ({event-dispatch}) initialized');
    }

    public static getInstance(): DispatchConsumer {
        if (!DispatchConsumer.instance) {
            DispatchConsumer.instance = new DispatchConsumer();
        }
        return DispatchConsumer.instance;
    }

    /**
     * Process dispatch job by delegating to delivery handler
     */
    private async process(job: Job<IDispatchJobData>): Promise<void> {
        const { event, target, headers, deliveryId } = job.data;
        // Format date for ClickHouse (YYYY-MM-DD HH:MM:SS.mmm)
        const toCHDate = (date: Date | string | number) =>
            new Date(date).toISOString().slice(0, 23).replace('T', ' ');

        const currentAttemptId = snowflake.generate();
        await job.log(
            `🚀 Dispatch starting (Attempt ${job.attemptsMade + 1}/${
                job.opts.attempts
            }, Local ID: ${currentAttemptId})`
        );

        const deliveryAttempt: SQLDeliveryAttempt = {
            delivery_id: currentAttemptId,
            workspace_id: event.workspaceId,
            namespace_id: event.namespaceId,

            // Links to other collections
            event_id: event.id,
            event_type: event.type,

            source_id: event.sourceId,
            source_type: event.sourceType,

            target_id: target.targetId,
            target_url: target.url,

            // Status
            status: DeliveryStatus.PENDING,
            attempt_number: job.attemptsMade + 1,

            // Request details
            request_method: target.method || 'POST',
            request_header: JSON.stringify(headers),
            request_body: JSON.stringify(event),

            // Response details
            response_code: null,
            response_header: '',
            response_body: '',
            response_time_ms: null,

            // Timestamps
            scheduled_at: toCHDate(event.timestamp),
            processed_at: null,

            // Error
            error: null,
        };

        try {
            logger.info(
                `🚀 Processing delivery job: ${job.id} for target: ${target.url} (attempt: ${
                    job.attemptsMade + 1
                }/${job.opts.attempts})`
            );

            // Send HTTP request - only 1 attempt per job execution
            const body = {
                id: event.id,
                type: event.type,
                timestamp: event.timestamp,
                workspaceId: event.workspaceId,
                namespaceId: event.namespaceId,

                data: {
                    object: event.data.object,
                    previous: event.data.previous,
                },
            };

            // 🛠️ APPLY CUSTOM TRANSFORMER
            let finalBody = { ...body };
            if (job.data.transform) {
                const { code, id } = job.data.transform;
                logger.debug(
                    `[Consumer] Applying custom transformer ${id} for delivery ${deliveryId}`
                );
                await job.log(`🛠️ Applying custom transformer (${id})...`);

                const sandboxResult = await sandboxExecutor.execute(code, body);

                if (sandboxResult.success) {
                    finalBody = sandboxResult.result;
                    await job.log(`✅ Transformation complete`);
                } else {
                    logger.error(
                        `[Consumer] Transformer ${id} failed: ${sandboxResult.error}. Falling back to original payload.`
                    );
                    await job.log(
                        `⚠️ Transformer failed: ${sandboxResult.error}. Falling back to original payload.`
                    );
                    // TRIGGER CUSTOMER ALERT
                    logger.warn(`[ALERT] Custom Transformer Failure for workspace ${event.workspaceId}`);
                }
            }

            // Perform signing before dispatch
            logger.debug(`🔏 Signing message for target ${target.url}...`);
            await job.log(`🔏 Signing message...`);
            const signatureResult = await dispatcherSignature.sign(
                finalBody,
                event.workspaceId,
                event.namespaceId,
                target.targetId,
                target.type
            );

            const signatureHeaders = await dispatcherSignature.buildHeaders(signatureResult);

            // Merge custom headers if they exist
            if (target.customHeaders) {
                Object.assign(headers, target.customHeaders);
            }

            Object.assign(headers, signatureHeaders);

            // Update delivery attempt record with final headers and body
            deliveryAttempt.request_header = JSON.stringify(headers);
            await job.log(`✅ Message signed`);
            const method = target.method || 'POST';
            await job.log(`📤 Sending ${method} request to ${target.url}`);
            const response = await httpRequester.request(method, target.url, finalBody, {
                headers: headers,
            });
            await job.log(`📥 Received response: ${response.status}`);

            // Update delivery attempt with response details
            deliveryAttempt.response_code = response.status;
            deliveryAttempt.response_header = JSON.stringify(response.headers);
            deliveryAttempt.response_body =
                typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
            deliveryAttempt.response_time_ms = response.duration;

            if (response.status < 200 || response.status >= 300) {
                throw new Error(`Target responded with status: ${response.status}`);
            }

            // DEBUG: Add to Delivery Attempt Collection
            await job.log(`📦 Sending success report to ClickHouse sink...`);
            await dispatchProducer
                .getQueues()
                .DispatchsQueue.add(dispatchProducer.getQueueNames().DispatchProducer, {
                    ...deliveryAttempt,
                    status: DeliveryStatus.DELIVERED,
                    attempt_number: job.attemptsMade + 1,
                    processed_at: toCHDate(new Date()),
                });

            await dispatchAnalyticsProducer.record({
                namespaceId: deliveryAttempt.namespace_id,
                targetId: deliveryAttempt.target_id,
                eventType: deliveryAttempt.event_type,
                responseCode: response.status,
                status: DeliveryStatus.DELIVERED,
                latencyMs: response.duration,
                timestamp: new Date(),
                deliveryId: currentAttemptId,
            });
            logger.debug(
                `✅ Delivery job completed and sent to sink: ${job.id} (${response.status})`
            );
            await job.log(`✅ Job completed successfully`);
        } catch (error: any) {
            logger.error(
                `❌ Delivery job failed: ${job.id} (attempt ${
                    job.attemptsMade + 1
                }/${job.opts.attempts})`,
                error.message
            );
            await job.log(`❌ POST failed: ${error.message}`);

            // Check if this was the last attempt
            const maxAttempts = job.opts.attempts || 3;
            if (job.attemptsMade + 1 >= maxAttempts) {
                logger.debug(
                    `❌ Max attempts (${maxAttempts}) reached for delivery: ${deliveryId}`
                );
                await job.log(`❌ Max attempts reached. marking as final failure.`);

                // BUG: Add to Delivery Attempt Collection
                await dispatchProducer
                    .getQueues()
                    .DispatchsQueue.add(dispatchProducer.getQueueNames().DispatchProducer, {
                        ...deliveryAttempt,
                        status: DeliveryStatus.FAILED,
                        attempt_number: job.attemptsMade + 1,

                        processed_at: toCHDate(new Date()),
                        error: error.message,
                    });
                await dispatchAnalyticsProducer.record({
                    namespaceId: deliveryAttempt.namespace_id,
                    targetId: deliveryAttempt.target_id,
                    eventType: deliveryAttempt.event_type,
                    responseCode: deliveryAttempt.response_code ?? 500,
                    status: DeliveryStatus.FAILED,
                    latencyMs: 0,
                    timestamp: new Date(),
                    deliveryId: currentAttemptId,
                });
            } else {
                logger.debug(
                    `📅 BullMQ will retry job ${job.id} (attempt ${
                        job.attemptsMade + 2
                    }/${maxAttempts})`
                );
                await job.log(`📅 Retrying...`);
                // BUG: Add to Delivery Attempt Collection
                await dispatchProducer
                    .getQueues()
                    .DispatchsQueue.add(dispatchProducer.getQueueNames().DispatchProducer, {
                        ...deliveryAttempt,
                        status: DeliveryStatus.FAILED,
                        attempt_number: job.attemptsMade + 1,
                        processed_at: toCHDate(new Date()),
                        error: error.message,
                    });
                await dispatchAnalyticsProducer.record({
                    namespaceId: deliveryAttempt.namespace_id,
                    targetId: deliveryAttempt.target_id,
                    eventType: deliveryAttempt.event_type,
                    responseCode: deliveryAttempt.response_code ?? 0,
                    status: DeliveryStatus.FAILED,
                    latencyMs: 0,
                    timestamp: new Date(),
                    deliveryId: currentAttemptId,
                });
            }

            // Throw error to trigger BullMQ retry
            throw error;
        }
    }

    private setupEventListeners(): void {
        this.dispatchWorker!.on('completed', (job: Job) => {
            if (job) {
                console.log(`✅ Dispatch job completed: ${job.id}`);
            }
        });

        this.dispatchWorker!.on('failed', (job: Job | undefined, err: Error) => {
            if (job) {
                console.error(`❌ Dispatch job failed: ${job.id}`, err.message);
            }
        });
    }

    public async shutdown(): Promise<void> {
        console.log('🔄 Shutting down event processor...');

        try {
            await this.dispatchWorker?.close();
            await this.queueEvents?.close();

            console.log('✅ Event processor shutdown complete');
        } catch (error: any) {
            console.error('❌ Error shutting down event processor:', error);
            throw error;
        }
    }

    public async forceProcessAll(): Promise<void> {
        console.log(
            '🚀 Force processing all waiting jobs... (Note: this is a consumer-only service)'
        );
    }
}

export const dispatchConsumer = DispatchConsumer.getInstance();
