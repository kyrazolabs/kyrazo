import { sql } from 'drizzle-orm';
import { db } from '../db/client';
import { analyticsDispatchDay } from '../db/schema';

export class DispatchAggregator {
    async aggregateMany(snapshots: Record<string, string>[]) {
        if (snapshots.length === 0) return;

        // In-memory pre-aggregation map
        // Key: Composite string of dimensions
        // Value: Aggregated metrics
        const aggMap = new Map<
            string,
            typeof analyticsDispatchDay.$inferInsert
        >();

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
            const targetId = parts[5];
            const eventType = parts[6];
            const responseCode = parseInt(parts[7] || '0', 10);

            // Derive bucketDay from the minute ISO string
            // Revert dashes to colons for valid ISO date parsing
            // 2023-01-01T12-00-00.000Z -> 2023-01-01T12:00:00.000Z
            // But be careful not to trigger on date part (YYYY-MM-DD) if it used dashes (it does).
            // Actually BaseProducer replaces ALL colons.
            // ISO format: YYYY-MM-DDTHH:mm:ss.sssZ
            // Redis key format: YYYY-MM-DDTHH-mm-ss.sssZ
            // We can replace all - with : ? No, date uses dashes.
            // We know the structure.
            // Or just string manipulation since we just need the day YYYY-MM-DD.
            // "2023-12-26T16-39-26.000Z" -> split 'T', take first part.
            // That is enough for bucketDay!

            const bucketDayStr = minuteIso.split('T')[0]!; // YYYY-MM-DD

            // Composite key for in-memory grouping
            const compositeKey = `${projectId}|${bucketDayStr}|${targetId}|${eventType}|${responseCode}`;

            const existing = aggMap.get(compositeKey) || {
                projectId,
                bucketDay: bucketDayStr, // String for date column
                targetId,
                eventType,
                responseCode,
                totalDeliveries: 0,
                successfulDeliveries: 0,
                failedDeliveries: 0,
                pendingDeliveries: 0,
                avgDeliveryTimeMs: 0,
            };

            const total = parseInt(snapshot['total'] || '0', 10);

            // Map 'delivered' -> successfulDeliveries
            const success = parseInt(snapshot['delivered'] || '0', 10);

            // Sum 'failed', 'timeout', 'network_error' -> failedDeliveries
            const failed =
                parseInt(snapshot['failed'] || '0', 10) +
                parseInt(snapshot['timeout'] || '0', 10) +
                parseInt(snapshot['network_error'] || '0', 10);

            // Map 'pending', 'processing' -> pendingDeliveries
            const pending =
                parseInt(snapshot['pending'] || '0', 10) +
                parseInt(snapshot['processing'] || '0', 10);

            // Latency handling
            const latencySum = parseInt(snapshot['latency_sum'] || '0', 10);
            const latencyCount = parseInt(snapshot['latency_count'] || '0', 10);

            const aggExisting = existing as any;
            aggExisting._latencySum =
                (aggExisting._latencySum || 0) + latencySum;
            aggExisting._latencyCount =
                (aggExisting._latencyCount || 0) + latencyCount;

            existing.totalDeliveries =
                (existing.totalDeliveries as number) + total;
            existing.successfulDeliveries =
                (existing.successfulDeliveries as number) + success;
            existing.failedDeliveries =
                (existing.failedDeliveries as number) + failed;
            existing.pendingDeliveries =
                (existing.pendingDeliveries as number) + pending;

            aggMap.set(compositeKey, existing);
        }

        const valuesToInsert = Array.from(aggMap.values()).map(val => {
            const aggVal = val as any;
            // Calculate initial average for the insert
            const count = aggVal._latencyCount;
            const sum = aggVal._latencySum;

            // Clean up temp properties
            delete aggVal._latencyCount;
            delete aggVal._latencySum;

            return {
                ...val,
                avgDeliveryTimeMs: count > 0 ? Math.round(sum / count) : 0,
            };
        });

        if (valuesToInsert.length === 0) return;

        await db
            .insert(analyticsDispatchDay)
            .values(valuesToInsert)
            .onConflictDoUpdate({
                target: [
                    analyticsDispatchDay.projectId,
                    analyticsDispatchDay.bucketDay,
                    analyticsDispatchDay.targetId,
                    analyticsDispatchDay.eventType,
                    analyticsDispatchDay.responseCode,
                ],
                set: {
                    totalDeliveries: sql`${analyticsDispatchDay.totalDeliveries} + EXCLUDED.total_deliveries`,
                    successfulDeliveries: sql`${analyticsDispatchDay.successfulDeliveries} + EXCLUDED.successful_deliveries`,
                    failedDeliveries: sql`${analyticsDispatchDay.failedDeliveries} + EXCLUDED.failed_deliveries`,
                    pendingDeliveries: sql`${analyticsDispatchDay.pendingDeliveries} + EXCLUDED.pending_deliveries`,
                    avgDeliveryTimeMs: sql`(
                        COALESCE(${analyticsDispatchDay.avgDeliveryTimeMs}, 0) * ${analyticsDispatchDay.totalDeliveries} + 
                        EXCLUDED.avg_delivery_time_ms * EXCLUDED.total_deliveries
                    ) / NULLIF(${analyticsDispatchDay.totalDeliveries} + EXCLUDED.total_deliveries, 0)`,
                },
            });
    }

    async aggregate(snapshot: any) {
        console.warn('Deprecated aggregate() called. Use aggregateMany()');
    }
}
