import { logger } from "@kyrazo/shared";
import {
    DeliveryRepo,
    IngestRepo,
    type SQLDeliveryAttempt,
    type SQLIngestEvent,
} from "@kyrazo/shared";

export class BatchWriter {
    private static instance: BatchWriter;

    private constructor() {}

    public static getInstance(): BatchWriter {
        if (!BatchWriter.instance) {
            BatchWriter.instance = new BatchWriter();
        }
        return BatchWriter.instance;
    }

    /**
     * Save a batch of delivery attempts to ClickHouse
     * @param attempts Array of delivery attempts
     */
    public async saveBatchedDeliveryAttempts(
        attempts: SQLDeliveryAttempt[],
    ): Promise<void> {
        if (!attempts.length) return;

        try {
            await DeliveryRepo.insert(attempts);

            logger.info(
                `✅ Successfully flushed ${attempts.length} delivery attempts to ClickHouse`,
            );
        } catch (error: any) {
            logger.error(
                "❌ Failed to flush delivery attempts batch to ClickHouse",
                error,
            );
            throw error; // Let caller handle retry/error
        }
    }

    /**
     * Save a batch of ingest events to ClickHouse
     * @param events Array of ingest events
     */
    public async saveBatchedIngestEvents(
        events: SQLIngestEvent[],
    ): Promise<void> {
        if (!events.length) return;

        try {
            await IngestRepo.insert(events);

            logger.info(
                `✅ Successfully flushed ${events.length} ingest events to ClickHouse`,
            );
        } catch (error: any) {
            logger.error(
                "❌ Failed to flush ingest events batch to ClickHouse",
                error,
            );
            throw error; // Let caller handle retry/error
        }
    }
}

export const batchWriter = BatchWriter.getInstance();
