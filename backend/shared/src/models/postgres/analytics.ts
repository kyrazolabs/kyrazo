import {
    pgTable,
    integer,
    varchar,
    date,
    bigint,
    primaryKey,
    index,
    smallint,
} from 'drizzle-orm/pg-core';

export const analyticsDispatchDay = pgTable(
    'analytics_dispatch_day',
    {
        namespaceId: varchar('namespace_id', { length: 50 }).notNull(),

        // nullable للتوسعة
        targetId: varchar('target_id', { length: 50 }),
        eventType: varchar('event_type', { length: 100 }),
        responseCode: integer('response_code'),

        bucketDay: date('bucket_day').notNull(),

        totalDeliveries: bigint('total_deliveries', {
            mode: 'number',
        }).notNull(),
        successfulDeliveries: bigint('successful_deliveries', {
            mode: 'number',
        }).notNull(),
        failedDeliveries: bigint('failed_deliveries', {
            mode: 'number',
        }).notNull(),
        pendingDeliveries: bigint('pending_deliveries', {
            mode: 'number',
        }).notNull(),

        avgDeliveryTimeMs: integer('avg_delivery_time_ms'),
    },
    t => ({
        pk: primaryKey({
            columns: [t.namespaceId, t.bucketDay, t.targetId, t.eventType, t.responseCode],
        }),
        namespaceDayIdx: index('dispatch_day_namespace_idx').on(t.namespaceId, t.bucketDay),
    })
);

export const analyticsIngestDay = pgTable(
    'analytics_ingest_day',
    {
        namespaceId: varchar('namespace_id', { length: 50 }).notNull(),

        sourceId: varchar('source_id', { length: 50 }),
        processingStatus: smallint('processing_status'), // 0 pending, 1 success, 2 failed

        bucketDay: date('bucket_day').notNull(),

        totalEvents: bigint('total_events', { mode: 'number' }).notNull(),
        successfulEvents: bigint('successful_events', {
            mode: 'number',
        }).notNull(),
        failedEvents: bigint('failed_events', { mode: 'number' }).notNull(),
        pendingEvents: bigint('pending_events', { mode: 'number' }).notNull(),
    },
    t => ({
        pk: primaryKey({
            columns: [t.namespaceId, t.bucketDay, t.sourceId, t.processingStatus],
        }),
        namespaceDayIdx: index('ingest_day_namespace_idx').on(t.namespaceId, t.bucketDay),
    })
);
