import { EventEmitter } from "events";
import { Queue, Worker, Job, QueueEvents } from "bullmq";
import { randomUUID } from "crypto";
import {
    QUEUE_CONFIG,
    JOB_TYPES,
    JOB_PRIORITIES,
} from "@/config/delivery/queue.config";
import { deliveryRepository } from "@/database/models/clickhouse/repositories/delivery.repo";
import { deliveryHandler } from "./delivery.handler";
import { IDispatchJobData } from "@/types/delivery/queue.types";

/**
 * Event Processor - Coordinates event processing and queue management
 * Manages the overall event processing workflow and queue lifecycle
 */
export class EventProcessor extends EventEmitter {
    private static instance: EventProcessor;

    // Queues
    private dispatchQueue: Queue;
    private batchQueue: Queue;

    // Workers
    private dispatchWorker: Worker;
    private batchWorker: Worker;

    // Queue Events
    private queueEvents: QueueEvents;

    // Metrics
    private metrics = {
        dispatched: 0,
        retried: 0,
        failed: 0,
        processingTime: 0,
    };

    private constructor() {
        super();

        // Initialize queues
        this.dispatchQueue = new Queue(QUEUE_CONFIG.DISPATCH_QUEUE.name, {
            connection: QUEUE_CONFIG.DISPATCH_QUEUE.redis,
            defaultJobOptions: QUEUE_CONFIG.DISPATCH_QUEUE.defaultJobOptions,
        });

        this.batchQueue = new Queue(QUEUE_CONFIG.BATCH_QUEUE.name, {
            connection: QUEUE_CONFIG.BATCH_QUEUE.redis,
            defaultJobOptions: QUEUE_CONFIG.BATCH_QUEUE.defaultJobOptions,
        });

        // Initialize workers
        this.dispatchWorker = new Worker(
            QUEUE_CONFIG.DISPATCH_QUEUE.name,
            this.processDispatchJob.bind(this),
            {
                connection: QUEUE_CONFIG.DISPATCH_QUEUE.redis,
                concurrency: QUEUE_CONFIG.DISPATCH_QUEUE.concurrency,
            }
        );

        this.batchWorker = new Worker(
            QUEUE_CONFIG.BATCH_QUEUE.name,
            this.processBatchJob.bind(this),
            {
                connection: QUEUE_CONFIG.BATCH_QUEUE.redis,
                concurrency: QUEUE_CONFIG.BATCH_QUEUE.concurrency,
            }
        );

        // Initialize queue events for monitoring
        this.queueEvents = new QueueEvents(QUEUE_CONFIG.DISPATCH_QUEUE.name, {
            connection: QUEUE_CONFIG.DISPATCH_QUEUE.redis,
        });

        this.setupEventListeners();
        this.startMetricsCollection();
        console.log("🚀 Event Processor initialized");
    }

    public static getInstance(): EventProcessor {
        if (!EventProcessor.instance) {
            EventProcessor.instance = new EventProcessor();
        }
        return EventProcessor.instance;
    }

    /**
     * Add event dispatch job to queue with maxRetries from event meta
     */
    public async addToQueue(
        eventId: string,
        webhookId: string,
        targetId: string,
        targetUrl: string,
        event: any, // Full event object to access meta.maxRetries
        headers: Record<string, string> = {},
        priority: number = JOB_PRIORITIES.NORMAL
    ): Promise<string> {
        try {
            const deliveryId = `del_${randomUUID()}`;
            const jobData: IDispatchJobData = {
                eventId,
                webhookId,
                targetId,
                targetUrl,
                eventData: event, // Use full event object
                headers,
                deliveryId,
                attemptNumber: 1,
                priority,
            };

            // Get maxRetries from event meta, default to 3
            const maxRetries = event.meta?.maxRetries || 3;

            const job = await this.dispatchQueue.add(
                JOB_TYPES.DISPATCH_EVENT,
                jobData,
                {
                    jobId: deliveryId,
                    priority,
                    delay: 0, // Process immediately
                    attempts: maxRetries, // Set attempts based on event meta
                    backoff: {
                        type: "exponential",
                        delay: 2000, // Start with 2 seconds
                    },
                }
            );

            console.log(
                `📦 Added dispatch job to queue: ${job.id} (priority: ${priority}, maxRetries: ${maxRetries})`
            );
            this.emit("jobAdded", {
                jobId: job.id,
                type: JOB_TYPES.DISPATCH_EVENT,
                maxRetries,
            });

            return job.id || deliveryId;
        } catch (error) {
            console.error("Error adding job to dispatch queue:", error);
            throw error;
        }
    }

    /**
     * Process dispatch job by delegating to delivery handler
     */
    private async processDispatchJob(
        job: Job<IDispatchJobData>
    ): Promise<void> {
        // Delegate to delivery handler for actual processing
        await deliveryHandler.processDelivery(job);
    }

    /**
     * Process batch job (placeholder for future batch operations)
     */
    private async processBatchJob(job: Job): Promise<void> {
        console.log(`📦 Processing batch job: ${job.id}`);
        // TODO: Implement batch processing logic
        this.emit("batchProcessed", { jobId: job.id });
    }

    /**
     * Setup event listeners for monitoring
     */
    private setupEventListeners(): void {
        // Dispatch queue events
        this.dispatchWorker.on("completed", (job: Job) => {
            if (job) {
                console.log(`✅ Dispatch job completed: ${job.id}`);
                this.updateMetrics("dispatched", 0); // Processing time tracked in handler
            }
        });

        this.dispatchWorker.on("failed", (job: Job | undefined, err: Error) => {
            if (job) {
                console.error(`❌ Dispatch job failed: ${job.id}`, err.message);
                this.updateMetrics("failed", 0); // Processing time tracked in handler
            }
        });

        // Queue events for monitoring
        this.queueEvents.on("waiting", ({ jobId }: { jobId: string }) => {
            console.log(`⏳ Job waiting: ${jobId}`);
        });

        this.queueEvents.on(
            "active",
            ({ jobId, prev }: { jobId: string; prev?: string }) => {
                console.log(`🔄 Job active: ${jobId} (prev: ${prev})`);
            }
        );
    }

    /**
     * Start metrics collection
     */
    private startMetricsCollection(): void {
        setInterval(() => {
            this.emit("metrics", { ...this.metrics });
        }, 60000); // Every minute
    }

    /**
     * Update metrics
     */
    private updateMetrics(
        type: "dispatched" | "retried" | "failed",
        processingTime: number
    ): void {
        this.metrics[type]++;

        if (processingTime > 0) {
            // Update average processing time
            const totalTime =
                this.metrics.processingTime *
                    (this.metrics.dispatched +
                        this.metrics.retried +
                        this.metrics.failed -
                        1) +
                processingTime;
            this.metrics.processingTime =
                totalTime /
                (this.metrics.dispatched +
                    this.metrics.retried +
                    this.metrics.failed);
        }
    }

    /**
     * Get queue statistics
     */
    public async getQueueStats(): Promise<{
        dispatchQueue: {
            waiting: number;
            active: number;
            completed: number;
            failed: number;
            delayed: number;
        };
        batchQueue: {
            waiting: number;
            active: number;
            completed: number;
            failed: number;
            delayed: number;
        };
    }> {
        const [dispatchStats, batchStats] = await Promise.all([
            this.dispatchQueue.getJobCounts(),
            this.batchQueue.getJobCounts(),
        ]);

        return {
            dispatchQueue: dispatchStats as {
                waiting: number;
                active: number;
                completed: number;
                failed: number;
                delayed: number;
            },
            batchQueue: batchStats as {
                waiting: number;
                active: number;
                completed: number;
                failed: number;
                delayed: number;
            },
        };
    }

    /**
     * Get current metrics
     */
    public getMetrics(): typeof this.metrics {
        return { ...this.metrics };
    }

    /**
     * Gracefully shutdown queues and workers
     */
    public async shutdown(): Promise<void> {
        console.log("🔄 Shutting down event processor...");

        try {
            // Close workers
            await Promise.all([
                this.dispatchWorker.close(),
                this.batchWorker.close(),
            ]);

            // Close queues
            await Promise.all([
                this.dispatchQueue.close(),
                this.batchQueue.close(),
            ]);

            // Close queue events
            await this.queueEvents.close();

            console.log("✅ Event processor shutdown complete");
        } catch (error) {
            console.error("❌ Error shutting down event processor:", error);
            throw error;
        }
    }

    /**
     * Force process all waiting jobs
     */
    public async forceProcessAll(): Promise<void> {
        console.log("🚀 Force processing all waiting jobs...");

        try {
            // Process dispatch queue
            const waitingJobs = await this.dispatchQueue.getWaiting();
            for (const job of waitingJobs) {
                await job.promote(); // Move from waiting to active
            }

            console.log(
                `✅ Promoted ${waitingJobs.length} jobs for immediate processing`
            );
        } catch (error) {
            console.error("❌ Error force processing jobs:", error);
            throw error;
        }
    }
}

export const eventProcessor = EventProcessor.getInstance();
