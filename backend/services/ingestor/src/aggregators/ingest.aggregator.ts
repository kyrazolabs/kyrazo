import { AnalyticsRepo, type SQLAnalyticsIngestDay } from '@kyrazo/shared';

import { ProcessingStatus } from '../types';

export class IngestAggregator {
    async aggregateMany(snapshots: Record<string, string>[]) {
        if (snapshots.length === 0) return;

        const aggMap = new Map<string, SQLAnalyticsIngestDay>();

        for (const snapshot of snapshots) {
            const key = snapshot['_key'];
            if (!key) continue;

            // Key format: analytics:rt:{projectId}:ingest:{minute}:{sourceId}:{status}
            const parts = key.split(':');

            if (parts.length < 7) {
                console.warn(`Invalid ingest key format: ${key}`);
                continue;
            }

            const projectId = parts[2]!;
            const minuteIso = parts[4];
            if (!minuteIso) continue;
            const sourceId = parts[5] || null;
            const statusStr = parts[6];

            let processingStatus = 0;
            if (statusStr === ProcessingStatus.PROCESSED) processingStatus = 1;
            else if (statusStr === ProcessingStatus.FAILED) processingStatus = 2;

            const bucketDayStr = minuteIso.split('T')[0]!;

            const compositeKey = `${projectId}|${bucketDayStr}|${sourceId}|${processingStatus}`;

            const existing = aggMap.get(compositeKey) || {
                namespace_id: projectId,
                bucket_day: bucketDayStr,
                source_id: sourceId,
                processing_status: processingStatus,
                total_events: 0,
                successful_events: 0,
                failed_events: 0,
                pending_events: 0,
            };

            const total = parseInt(snapshot['total'] || '0', 10);
            const success = parseInt(snapshot['success'] || '0', 10);
            const failed = parseInt(snapshot['failed'] || '0', 10);
            const pending = parseInt(snapshot['pending'] || '0', 10);

            existing.total_events += total;
            existing.successful_events += success;
            existing.failed_events += failed;
            existing.pending_events += pending;

            aggMap.set(compositeKey, existing);
        }

        const valuesToInsert = Array.from(aggMap.values());

        if (valuesToInsert.length === 0) return;

        await AnalyticsRepo.insertIngestDay(valuesToInsert);
    }

    async aggregate(snapshot: any) {
        console.warn('Deprecated aggregate() called. Use aggregateMany()');
    }
}
