CREATE TABLE IF NOT EXISTS analytics_dispatch_day (
    namespace_id String CODEC(ZSTD(3)),
    target_id String CODEC(ZSTD(3)),
    event_type String CODEC(ZSTD(3)),
    response_code UInt16,
    bucket_day Date,

    total_deliveries UInt64,
    successful_deliveries UInt64,
    failed_deliveries UInt64,
    pending_deliveries UInt64,
    delivery_time_sum UInt64
)
ENGINE = SummingMergeTree((total_deliveries, successful_deliveries, failed_deliveries, pending_deliveries, delivery_time_sum))
PARTITION BY toYYYYMM(bucket_day)
ORDER BY (namespace_id, bucket_day, target_id, event_type, response_code);

CREATE TABLE IF NOT EXISTS analytics_ingest_day (
    namespace_id String CODEC(ZSTD(3)),
    source_id String CODEC(ZSTD(3)),
    processing_status UInt8,
    bucket_day Date,

    total_events UInt64,
    successful_events UInt64,
    failed_events UInt64,
    pending_events UInt64
)
ENGINE = SummingMergeTree((total_events, successful_events, failed_events, pending_events))
PARTITION BY toYYYYMM(bucket_day)
ORDER BY (namespace_id, bucket_day, source_id, processing_status);
