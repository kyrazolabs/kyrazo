import { EventEmitter } from "events";
import { Queue, Worker, Job, QueueEvents } from "bullmq";
import { redisConfig } from "@/config";
import { randomUUID } from "crypto";
import type {
    IConfiguredTarget,
    IDispatchedEvent,
    IDispatchedTarget,
    IDispatchJobData,
    IWebhookHeaders,
} from "@/core/dispatcher/dispatcher.types";
import {
    DeliveryStatus,
    EventStatus,
    logger,
    type SQLDeliveryAttempt,
} from "@kyrazo/shared";
import { httpRequester } from "@/services/http/http.requester";
import { dispatchProducer } from "../batch/dispatch.producer";
import { env } from "@/app/worker.env";
import { config } from "@/config";
import { dispatcherSignature } from "@/core/dispatcher/dispatcher.signature";
import { dispatchAnalyticsProducer } from "@/services/analytics/dispatch.producer";

/**
 * Event Processor - Coordinates event processing and queue management
 * Manages the overall event processing workflow and queue lifecycle
 */
export class DispatchConsumer extends EventEmitter {
    private static instance: DispatchConsumer;

    private dispatchQueue: Queue | undefined;
    private dispatchWorker: Worker | undefined;
    private queueEvents: QueueEvents | undefined;

    private constructor() {
        super();
    }

    public async initialize(): Promise<void> {
        if (this.dispatchQueue) return;

        logger.info("Initializing Dispatch Consumer...");
        const connection = redisConfig.getQueueClient();

        // Initialize queues
        this.dispatchQueue = new Queue(`event-dispatch`, {
            connection,
            defaultJobOptions: {
                removeOnComplete: 100, // Keep last 100 completed jobs
                removeOnFail: 50, // Keep last 50 failed jobs
                attempts: 3, // Default attempts (will be overridden per job based on event.meta.maxRetries)
                backoff: {
                    type: "exponential",
                    delay: 2000, // Start with 2 seconds
                },
            },
        });

        // Initialize workers
        this.dispatchWorker = new Worker(
            `event-dispatch`,
            this.process.bind(this),
            {
                connection,
                concurrency: env.worker.CONCURRENCY,
            },
        );

        // Initialize queue events for monitoring
        this.queueEvents = new QueueEvents(`event-dispatch`, {
            connection,
        });

        this.setupEventListeners();
        logger.info("🚀 Event Processor (event-dispatch) initialized");
    }

    public static getInstance(): DispatchConsumer {
        if (!DispatchConsumer.instance) {
            DispatchConsumer.instance = new DispatchConsumer();
        }
        return DispatchConsumer.instance;
    }

    public async enqueue(
        event: IDispatchedEvent,
        targets: IConfiguredTarget[],
        headers: IWebhookHeaders,
    ): Promise<(string | undefined)[]> {
        if (!this.dispatchQueue) {
            throw new Error("DispatchConsumer not initialized");
        }
        try {
            const jobData = {
                event,
                headers,
            };

            // Get maxRetries from event meta, default to 3
            const maxRetries = event.meta?.maxRetries || 3;

            const jobs = await this.dispatchQueue.addBulk(
                targets.map((target) => {
                    const deliveryId = `${randomUUID()}`;
                    // Retry count is the number of *retries*, so total attempts = retries + 1
                    const attempts = (target.retryCount || maxRetries) + 1;
                    return {
                        name: "dispatch",
                        data: { ...jobData, deliveryId, target },
                        opts: {
                            jobId: deliveryId,
                            priority: target.priority,
                            delay: 0, // Process immediately
                            attempts: attempts, // Set total attempts
                            backoff: {
                                type: "exponential",
                                delay: 2000, // Start with 2 seconds
                            },
                        },
                    };
                }),
            );

            const jobIds = jobs.map((job) => job.id);
            const deliveryIds = jobs.map((job) => job.opts.jobId);

            logger.info(
                `📦 Added dispatch job to queue: ${jobIds.join(
                    ", ",
                )} (maxRetries: ${maxRetries})`,
            );

            return jobIds || deliveryIds;
        } catch (error) {
            console.error("Error adding job to dispatch queue:", error);
            throw error;
        }
    }

    /**
     * Process dispatch job by delegating to delivery handler
     */
    private async process(job: Job<IDispatchJobData>): Promise<void> {
        const { event, target, headers, deliveryId } = job.data;
        // Format date for ClickHouse (YYYY-MM-DD HH:MM:SS.mmm)
        const toCHDate = (date: Date | string | number) =>
            new Date(date).toISOString().slice(0, 23).replace("T", " ");

        await job.log(
            `🚀 Dispatch starting (Attempt ${job.attemptsMade + 1}/${
                job.opts.attempts
            })`,
        );

        const deliveryAttempt: SQLDeliveryAttempt = {
            delivery_id: deliveryId,
            workspace_id: event.workspaceId,
            project_id: event.projectId,

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
            request_header: JSON.stringify(headers),
            request_body: JSON.stringify(event),

            // Response details
            response_code: null,
            response_header: "",
            response_body: "",
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
                }/${job.opts.attempts})`,
            );

            // Send HTTP request - only 1 attempt per job execution
            const body = {
                id: event.id,
                type: event.type,
                timestamp: event.timestamp,
                workspaceId: event.workspaceId,
                projectId: event.projectId,

                data: {
                    object: event.data.object,
                    previous: event.data.previous,
                },

                meta: event.meta ?? {},
            };
            // Perform signing before dispatch
            logger.debug(`🔏 Signing message for target ${target.url}...`);
            await job.log(`🔏 Signing message...`);
            const signatureResult = await dispatcherSignature.sign(
                event,
                event.workspaceId,
                event.projectId,
                target.targetId,
                target.type,
            );

            const signatureHeaders =
                await dispatcherSignature.buildHeaders(signatureResult);
            Object.assign(headers, signatureHeaders);

            // Update delivery attempt record with final headers
            deliveryAttempt.request_header = JSON.stringify(headers);
            logger.debug(`✅ Message signed successfully`);
            await job.log(`✅ Message signed`);

            logger.info(`📤 Sending POST request to ${target.url}...`);
            await job.log(`📤 Sending POST request to ${target.url}`);
            const response = await httpRequester.post(target.url, body, {
                headers: headers,
            });

            logger.info(
                `📥 Received response from ${target.url}: ${response.status}`,
            );
            await job.log(`📥 Received response: ${response.status}`);

            // DEBUG: Add to Delivery Attempt Collection
            logger.info(`📦 Sending delivery attempt to ClickHouse sink...`);
            await job.log(`📦 Sending success report to ClickHouse sink...`);
            await dispatchProducer
                .getQueues()
                .DispatchsQueue.add(
                    dispatchProducer.getQueueNames().DispatchProducer,
                    {
                        ...deliveryAttempt,
                        status: DeliveryStatus.DELIVERED,
                        attempt_number: job.attemptsMade + 1,

                        response_code: response.status,
                        response_header: JSON.stringify(response.headers),
                        response_body:
                            typeof response.data === "string"
                                ? response.data
                                : JSON.stringify(response.data),
                        response_time_ms: response.duration,

                        processed_at: toCHDate(new Date()),
                    },
                );

            await dispatchAnalyticsProducer.record({
                projectId: deliveryAttempt.project_id,
                targetId: deliveryAttempt.target_id,
                eventType: deliveryAttempt.event_type,
                responseCode: response.status,
                status: DeliveryStatus.DELIVERED,
                latencyMs: response.duration,
                timestamp: new Date(),
                deliveryId: deliveryAttempt.delivery_id,
            });
            logger.debug(
                `✅ Delivery job completed and sent to sink: ${job.id} (${response.status})`,
            );
            await job.log(`✅ Job completed successfully`);
        } catch (error: any) {
            logger.error(
                `❌ Delivery job failed: ${job.id} (attempt ${
                    job.attemptsMade + 1
                }/${job.opts.attempts})`,
                error.message,
            );
            await job.log(`❌ POST failed: ${error.message}`);

            // Check if this was the last attempt
            const maxAttempts = job.opts.attempts || 3;
            if (job.attemptsMade + 1 >= maxAttempts) {
                logger.debug(
                    `❌ Max attempts (${maxAttempts}) reached for delivery: ${deliveryId}`,
                );
                await job.log(
                    `❌ Max attempts reached. marking as final failure.`,
                );

                // BUG: Add to Delivery Attempt Collection
                await dispatchProducer
                    .getQueues()
                    .DispatchsQueue.add(
                        dispatchProducer.getQueueNames().DispatchProducer,
                        {
                            ...deliveryAttempt,
                            status: DeliveryStatus.FAILED,
                            attempt_number: job.attemptsMade + 1,

                            processed_at: toCHDate(new Date()),
                            error: error.message,
                        },
                    );
                await dispatchAnalyticsProducer.record({
                    projectId: deliveryAttempt.project_id,
                    targetId: deliveryAttempt.target_id,
                    eventType: deliveryAttempt.event_type,
                    responseCode: 400, // or 500? Use 0 or -1?
                    status: DeliveryStatus.FAILED,
                    latencyMs: 0,
                    timestamp: new Date(),
                    deliveryId: deliveryAttempt.delivery_id,
                });
            } else {
                logger.debug(
                    `📅 BullMQ will retry job ${job.id} (attempt ${
                        job.attemptsMade + 2
                    }/${maxAttempts})`,
                );
                await job.log(`📅 Retrying...`);
                // BUG: Add to Delivery Attempt Collection
                await dispatchProducer
                    .getQueues()
                    .DispatchsQueue.add(
                        dispatchProducer.getQueueNames().DispatchProducer,
                        {
                            ...deliveryAttempt,
                            status: DeliveryStatus.PROCESSING,
                            attempt_number: job.attemptsMade + 1,
                            processed_at: toCHDate(new Date()),
                            error: error.message,
                        },
                    );
                await dispatchAnalyticsProducer.record({
                    projectId: deliveryAttempt.project_id,
                    targetId: deliveryAttempt.target_id,
                    eventType: deliveryAttempt.event_type,
                    responseCode: 0,
                    status: DeliveryStatus.PROCESSING,
                    latencyMs: 0,
                    timestamp: new Date(),
                    deliveryId: deliveryAttempt.delivery_id,
                });
            }

            // Throw error to trigger BullMQ retry
            throw error;
        }
    }

    private setupEventListeners(): void {
        this.dispatchWorker!.on("completed", (job: Job) => {
            if (job) {
                console.log(`✅ Dispatch job completed: ${job.id}`);
            }
        });

        this.dispatchWorker!.on(
            "failed",
            (job: Job | undefined, err: Error) => {
                if (job) {
                    console.error(
                        `❌ Dispatch job failed: ${job.id}`,
                        err.message,
                    );
                }
            },
        );

        this.queueEvents!.on("waiting", ({ jobId }: { jobId: string }) => {
            console.log(`⏳ Job waiting: ${jobId}`);
        });

        this.queueEvents!.on(
            "active",
            ({ jobId, prev }: { jobId: string; prev?: string }) => {
                console.log(`🔄 Job active: ${jobId} (prev: ${prev})`);
            },
        );
    }

    public async shutdown(): Promise<void> {
        console.log("🔄 Shutting down event processor...");

        try {
            await this.dispatchWorker?.close();
            await this.dispatchQueue?.close();
            await this.queueEvents?.close();

            console.log("✅ Event processor shutdown complete");
        } catch (error) {
            console.error("❌ Error shutting down event processor:", error);
            throw error;
        }
    }

    public async forceProcessAll(): Promise<void> {
        if (!this.dispatchQueue) {
            throw new Error("DispatchConsumer not initialized");
        }
        console.log("🚀 Force processing all waiting jobs...");

        try {
            const waitingJobs = await this.dispatchQueue.getWaiting();
            for (const job of waitingJobs) {
                await job.promote();
            }
            console.log(
                `✅ Promoted ${waitingJobs.length} jobs for immediate processing`,
            );
        } catch (error) {
            console.error("❌ Error force processing jobs:", error);
            throw error;
        }
    }
}

export const dispatchConsumer = DispatchConsumer.getInstance();
