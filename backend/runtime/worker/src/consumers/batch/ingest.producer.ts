import { Redis } from "ioredis";
import { Queue, Worker, Job } from "bullmq";
import { config, redisConfig } from "@/config";
import { logger, type SQLIngestEvent } from "@kyrazo/shared";
import { batchWriter } from "@/services/clickhouse/batch.writer";

export class IngestProducer {
    private static instance: IngestProducer;
    private redisUrl: string | undefined;
    private redisOptions: any;

    // Singleton instances
    private ingestQueue: Queue<SQLIngestEvent> | undefined;
    private ingestWorker: Worker<SQLIngestEvent> | undefined;

    // Buffering
    private buffer: {
        data: SQLIngestEvent;
        resolve: () => void;
        reject: (err: any) => void;
        jobId?: string;
    }[] = [];
    private readonly maxBatchSize = 1000;
    private readonly flushIntervalMs = 1000;
    private flushTimer: NodeJS.Timeout | null = null;

    private constructor() {}

    public async initialize(): Promise<void> {
        if (this.ingestQueue) return;

        logger.info("[IngestProducer] Initializing...");
        this.initializeQueue();
        this.initializeWorker();

        // Start periodic flush timer
        this.startFlushTimer();
    }

    public static getInstance(): IngestProducer {
        if (!IngestProducer.instance) {
            IngestProducer.instance = new IngestProducer();
        }
        return IngestProducer.instance;
    }

    public getQueueNames() {
        return {
            IngestQueue: "batch-ingest-events",
        };
    }

    private initializeQueue() {
        const queueName = this.getQueueNames().IngestQueue;
        const connection = redisConfig.getQueueClient();

        this.ingestQueue = new Queue<SQLIngestEvent>(queueName, {
            connection,
            defaultJobOptions: {
                attempts: 10,
                backoff: {
                    type: "exponential",
                    delay: 5000,
                },
                removeOnComplete: true,
                removeOnFail: false,
            },
        });

        logger.info(`[IngestProducer] Queue ${queueName} initialized`);
    }

    private initializeWorker() {
        const queueName = this.getQueueNames().IngestQueue;
        const connection = redisConfig.getQueueClient();

        this.ingestWorker = new Worker<SQLIngestEvent>(
            queueName,
            async (job: Job<SQLIngestEvent>) => {
                await this.processJob(job);
            },
            {
                connection,
                concurrency: 50, // High concurrency for high throughput
                maxStalledCount: 0,
            },
        );

        this.ingestWorker.on("failed", (job, err) => {
            logger.error(
                `[IngestProducer] Worker failed for job ${job?.id}:`,
                err,
            );
        });

        logger.info(`[IngestProducer] Worker ${queueName} initialized`);
    }

    private startFlushTimer() {
        if (this.flushTimer) clearInterval(this.flushTimer);
        this.flushTimer = setInterval(() => {
            this.flush();
        }, this.flushIntervalMs);
    }

    private async processJob(job: Job<SQLIngestEvent>) {
        return new Promise<void>(async (resolve, reject) => {
            logger.info(
                `[IngestProducer] Buffering ingest event for ClickHouse batch (${this.buffer.length + 1}/${this.maxBatchSize})`,
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
                `[IngestProducer] Flushing ${batch.length} ingest events to ClickHouse`,
            );
            await batchWriter.saveBatchedIngestEvents(dataBatch);

            // Resolve all jobs in the batch
            batch.forEach((b) => b.resolve());
            logger.info(
                `[IngestProducer] Successfully resolved ${batch.length} jobs`,
            );
        } catch (error: any) {
            logger.error(
                "[IngestProducer] Failed to flush batch to ClickHouse:",
                error,
            );
            // Reject all jobs in the batch to trigger BullMQ retries
            batch.forEach((b) => b.reject(error));
        }
    }

    // Public API to access the queue for producers (like DispatchConsumer)
    public getQueues() {
        if (!this.ingestQueue) {
            throw new Error("IngestProducer Queue not initialized");
        }
        return {
            IngestQueue: this.ingestQueue,
        };
    }

    public async close() {
        if (this.flushTimer) clearInterval(this.flushTimer);
        await this.flush(); // Flush remaining
        await this.ingestQueue?.close();
        await this.ingestWorker?.close();
    }
}

export const ingestProducer = IngestProducer.getInstance();
