import { Redis } from "ioredis";
import { Queue, Worker, Job } from "bullmq";
import { config, redisConfig } from "@/config";
import { logger, type SQLDeliveryAttempt } from "@kyrazo/shared";
import { batchWriter } from "@/services/clickhouse/batch.writer";

export class DispatchProducer {
    private static instance: DispatchProducer;

    // Singleton instances
    private dispatchQueue: Queue<SQLDeliveryAttempt> | undefined;
    private dispatchWorker: Worker<SQLDeliveryAttempt> | undefined;

    // Buffering
    // Buffering
    private buffer: {
        data: SQLDeliveryAttempt;
        resolve: () => void;
        reject: (err: any) => void;
        jobId?: string;
    }[] = [];
    private readonly maxBatchSize = 1000;
    private readonly flushIntervalMs = 1000;
    private flushTimer: NodeJS.Timeout | null = null;

    private constructor() {}

    public async initialize(): Promise<void> {
        if (this.dispatchQueue) return;

        logger.info("[DispatchProducer] Initializing...");
        this.initializeQueue();
        this.initializeWorker();

        // Start periodic flush timer
        this.startFlushTimer();
    }

    public static getInstance(): DispatchProducer {
        if (!DispatchProducer.instance) {
            DispatchProducer.instance = new DispatchProducer();
        }
        return DispatchProducer.instance;
    }

    public getQueueNames() {
        return {
            DispatchProducer: "batch-dispatch-events",
        };
    }

    private initializeQueue() {
        const queueName = this.getQueueNames().DispatchProducer;
        const connection = redisConfig.getQueueClient();

        this.dispatchQueue = new Queue<SQLDeliveryAttempt>(queueName, {
            connection,
            defaultJobOptions: {
                attempts: 10, // Increased default attempts for batch persistence
                backoff: {
                    type: "exponential",
                    delay: 5000,
                },
                removeOnComplete: false,
                removeOnFail: false,
            },
        });

        logger.info(`[DispatchProducer] Queue ${queueName} initialized`);
    }

    private initializeWorker() {
        const queueName = this.getQueueNames().DispatchProducer;
        const connection = redisConfig.getQueueClient();

        this.dispatchWorker = new Worker<SQLDeliveryAttempt>(
            queueName,
            async (job: Job<SQLDeliveryAttempt>) => {
                await this.processJob(job);
            },
            {
                connection,
                concurrency: 50, // High concurrency for high throughput
                maxStalledCount: 0,
            },
        );

        this.dispatchWorker.on("failed", (job, err) => {
            logger.error(
                `[DispatchProducer] Worker failed for job ${job?.id}:`,
                err,
            );
        });

        logger.info(`[DispatchProducer] Worker ${queueName} initialized`);
    }

    private startFlushTimer() {
        if (this.flushTimer) clearInterval(this.flushTimer);
        this.flushTimer = setInterval(() => {
            this.flush();
        }, this.flushIntervalMs);
    }

    private async processJob(job: Job<SQLDeliveryAttempt>) {
        return new Promise<void>(async (resolve, reject) => {
            logger.info(
                `[DispatchProducer] Buffering delivery attempt for ClickHouse batch (${this.buffer.length + 1}/${this.maxBatchSize})`,
            );
            await job.log(`Adding to ClickHouse buffer...`);

            this.buffer.push({
                data: job.data,
                resolve,
                reject,
                jobId: job.id,
            });

            if (this.buffer.length >= this.maxBatchSize) {
                this.flush();
            }
        });
    }

    private async flush() {
        if (this.buffer.length === 0) return;

        const batch = [...this.buffer];
        this.buffer = []; // Clear buffer immediately

        const dataBatch = batch.map((b) => b.data);

        try {
            logger.info(
                `[DispatchProducer] Flushing ${batch.length} delivery attempts to ClickHouse`,
            );
            await batchWriter.saveBatchedDeliveryAttempts(dataBatch);

            // Resolve all jobs in the batch
            batch.forEach((b) => b.resolve());
            logger.info(
                `[DispatchProducer] Successfully resolved ${batch.length} jobs`,
            );
        } catch (error: any) {
            logger.error(
                "[DispatchProducer] Failed to flush batch to ClickHouse:",
                error,
            );
            // Reject all jobs in the batch to trigger BullMQ retries
            batch.forEach((b) => b.reject(error));
        }
    }

    // Public API to access the queue for producers (like DispatchConsumer)
    public getQueues() {
        if (!this.dispatchQueue) {
            throw new Error("DispatchProducer Queue not initialized");
        }
        return {
            DispatchsQueue: this.dispatchQueue,
        };
    }

    public async close() {
        if (this.flushTimer) clearInterval(this.flushTimer);
        await this.flush(); // Flush remaining
        await this.dispatchQueue?.close();
        await this.dispatchWorker?.close();
    }
}

export const dispatchProducer = DispatchProducer.getInstance();
