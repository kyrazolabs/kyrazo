import { AnalyticsRepo, type SQLAnalyticsDispatchDay } from '@kyrazo/shared';

export class DispatchAggregator {
    async aggregateMany(snapshots: Record<string, string>[]) {
        if (snapshots.length === 0) return;

        // In-memory pre-aggregation map
        // Key: Composite string of dimensions
        const aggMap = new Map<string, SQLAnalyticsDispatchDay>();

        for (const snapshot of snapshots) {
            const key = snapshot['_key'];
            if (!key) continue;

            // Key format: analytics:rt:{projectId}:dispatch:{minute}:{targetId}:{eventType}:{responseCode}
            const parts = key.split(':');
            if (parts.length < 8) {
                console.warn(`Invalid dispatch key format: ${key}`);
                continue;
            }

            const projectId = parts[2]!;
            const minuteIso = parts[4];
            if (!minuteIso) continue;
            const targetId = parts[5] || null;
            const eventType = parts[6] || null;
            const responseCode = parseInt(parts[7] || '0', 10);

            const bucketDayStr = minuteIso.split('T')[0]!; // YYYY-MM-DD

            // Composite key for in-memory grouping
            const compositeKey = `${projectId}|${bucketDayStr}|${targetId}|${eventType}|${responseCode}`;

            const existing = aggMap.get(compositeKey) || {
                namespace_id: projectId,
                bucket_day: bucketDayStr,
                target_id: targetId,
                event_type: eventType,
                response_code: responseCode,
                total_deliveries: 0,
                successful_deliveries: 0,
                failed_deliveries: 0,
                pending_deliveries: 0,
                delivery_time_sum: 0,
            };

            const total = parseInt(snapshot['total'] || '0', 10);
            const success = parseInt(snapshot['delivered'] || '0', 10);
            const failed =
                parseInt(snapshot['failed'] || '0', 10) +
                parseInt(snapshot['timeout'] || '0', 10) +
                parseInt(snapshot['network_error'] || '0', 10);
            const pending =
                parseInt(snapshot['pending'] || '0', 10) +
                parseInt(snapshot['processing'] || '0', 10);

            const latencySum = parseInt(snapshot['latency_sum'] || '0', 10);

            existing.total_deliveries += total;
            existing.successful_deliveries += success;
            existing.failed_deliveries += failed;
            existing.pending_deliveries += pending;
            existing.delivery_time_sum += latencySum;

            aggMap.set(compositeKey, existing);
        }

        const valuesToInsert = Array.from(aggMap.values());

        if (valuesToInsert.length === 0) return;

        await AnalyticsRepo.insertDispatchDay(valuesToInsert);
    }

    async aggregate(snapshot: any) {
        console.warn('Deprecated aggregate() called. Use aggregateMany()');
    }
}
