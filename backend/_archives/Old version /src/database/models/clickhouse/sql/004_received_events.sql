CREATE TABLE IF NOT EXISTS received_events (
    event_id String CODEC(ZSTD(3)),
    webhook_id String CODEC(ZSTD(3)),
    source LowCardinality(String) CODEC(ZSTD(3)),
    workspace_id String CODEC(ZSTD(3)),
    user_id String CODEC(ZSTD(3)),
    ingress_id String CODEC(ZSTD(3)),

    received_at DateTime64(3, 'UTC') CODEC(DoubleDelta, LZ4),
    created_at DateTime64(3, 'UTC') CODEC(DoubleDelta, LZ4),
    updated_at DateTime64(3, 'UTC') CODEC(DoubleDelta, LZ4),

    headers String CODEC(ZSTD(5)),
    body String CODEC(ZSTD(5)),
    verified Bool CODEC(T64, LZ4),

    processing_status Enum8('pending' = 1, 'processed' = 2, 'failed' = 3) CODEC(LZ4),
    processing_error String CODEC(ZSTD(3)),

    associated_event_id String CODEC(ZSTD(3)),
    route_to Nullable(String) CODEC(ZSTD(3)),
    route_priority Enum8('low' = 1, 'normal' = 2, 'high' = 3, 'urgent' = 4) CODEC(LZ4),
    route_max_retries UInt8 CODEC(T64, LZ4),
    route_inserted_at DateTime64(3, 'UTC') CODEC(DoubleDelta, LZ4)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (workspace_id, received_at, event_id)
TTL created_at + INTERVAL 90 DAY DELETE;
