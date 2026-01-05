import { sql } from 'drizzle-orm';
import { db } from '../db/client';
import { analyticsIngestDay } from '../db/schema';
import { ProcessingStatus } from '../types';

export class IngestAggregator {
    async aggregateMany(snapshots: Record<string, string>[]) {
        if (snapshots.length === 0) return;

        const aggMap = new Map<
            string,
            typeof analyticsIngestDay.$inferInsert
        >();

        for (const snapshot of snapshots) {
            const key = snapshot['_key'];
            if (!key) continue;

            // Key format: analytics:rt:{projectId}:ingest:{minute}:{sourceId}:{status}
            const parts = key.split(':');
            // parts[0] = analytics
            // parts[1] = rt
            // parts[2] = projectId
            // parts[3] = ingest
            // parts[4] = minuteIso
            // parts[5] = sourceId
            // parts[6] = status (success/failed/pending) -> mapped to processingStatus in PG?

            // Wait, schema says processingStatus is smallint.
            // ingest.producer.ts uses string status in key?
            // Let's check producer.type.ts or ingest.producer.ts.
            // IngestProducer key: `analytics:rt:${event.projectId}:ingest:${minute}:${event.sourceId}:${event.status}`
            // event.status is string 'success' | 'failed' | 'pending' (implied)
            // Schema: processingStatus: smallint. 0 pending, 1 success, 2 failed.

            if (parts.length < 7) {
                console.warn(`Invalid ingest key format: ${key}`);
                continue;
            }

            const projectId = parts[2];
            const minuteIso = parts[4];
            const sourceId = parts[5];
            const statusStr = parts[6];

            let processingStatus = 0;
            if (statusStr === ProcessingStatus.PROCESSED) processingStatus = 1;
            else if (statusStr === ProcessingStatus.FAILED)
                processingStatus = 2;

            // Derive bucketDay
            const bucketDayStr = minuteIso.split('T')[0];

            const compositeKey = `${projectId}|${bucketDayStr}|${sourceId}|${processingStatus}`;

            const existing = aggMap.get(compositeKey) || {
                projectId,
                bucketDay: bucketDayStr,
                sourceId,
                processingStatus,
                totalEvents: 0,
                successfulEvents: 0,
                failedEvents: 0,
                pendingEvents: 0,
            };

            const total = parseInt(snapshot['total'] || '0', 10);
            const success = parseInt(snapshot['success'] || '0', 10);
            const failed = parseInt(snapshot['failed'] || '0', 10);
            const pending = parseInt(snapshot['pending'] || '0', 10);

            existing.totalEvents = (existing.totalEvents as number) + total;
            existing.successfulEvents =
                (existing.successfulEvents as number) + success;
            existing.failedEvents = (existing.failedEvents as number) + failed;
            existing.pendingEvents =
                (existing.pendingEvents as number) + pending;

            aggMap.set(compositeKey, existing);
        }

        const valuesToInsert = Array.from(aggMap.values());

        if (valuesToInsert.length === 0) return;

        await db
            .insert(analyticsIngestDay)
            .values(valuesToInsert)
            .onConflictDoUpdate({
                target: [
                    analyticsIngestDay.projectId,
                    analyticsIngestDay.bucketDay,
                    analyticsIngestDay.sourceId,
                    analyticsIngestDay.processingStatus,
                ],
                set: {
                    totalEvents: sql`${analyticsIngestDay.totalEvents} + EXCLUDED.total_events`,
                    successfulEvents: sql`${analyticsIngestDay.successfulEvents} + EXCLUDED.successful_events`,
                    failedEvents: sql`${analyticsIngestDay.failedEvents} + EXCLUDED.failed_events`,
                    pendingEvents: sql`${analyticsIngestDay.pendingEvents} + EXCLUDED.pending_events`,
                },
            });
    }

    async aggregate(snapshot: any) {
        console.warn('Deprecated aggregate() called. Use aggregateMany()');
    }
}
