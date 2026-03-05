import { ProcessingStatus } from '@kyrazo/shared';
import { BaseProducer } from './base.producer';
import type { IngestEventInput } from './producer.type';

class IngestProducer extends BaseProducer {
    async record(event: IngestEventInput): Promise<void> {
        const minute = this.getMinuteBucket(event.timestamp);
        const key = `analytics:rt:${event.namespaceId}:ingest:${minute}:${event.sourceId}:${event.status}`;

        const pipeline = this.redis.pipeline();

        pipeline.hincrby(key, 'total', 1);

        if (event.status === ProcessingStatus.PROCESSED) {
            pipeline.hincrby(key, ProcessingStatus.PROCESSED, 1);
        } else if (event.status === ProcessingStatus.FAILED) {
            pipeline.hincrby(key, ProcessingStatus.FAILED, 1);
        } else if (event.status === ProcessingStatus.PENDING) {
            pipeline.hincrby(key, ProcessingStatus.PENDING, 1);
        }

        pipeline.expire(key, 120);

        await pipeline.exec();
    }
}

export const ingestAnalyticsProducer = new IngestProducer();
