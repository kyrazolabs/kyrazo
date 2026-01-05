CREATE TABLE IF NOT EXISTS dispatched_events (
    event_id UUID CODEC(ZSTD(3)),

    workspace_id LowCardinality(String),
    project_id   LowCardinality(String),
    event_type   LowCardinality(String),

    occurred_at DateTime64(3, 'UTC') CODEC(Delta, ZSTD),

    data        String CODEC(ZSTD(5)),
    previous    Nullable(String) CODEC(ZSTD(5)),

    target_id   LowCardinality(String),
    target_url  String CODEC(ZSTD(3)),

    meta_priority Enum8( 'low' = 1, 'normal' = 2, 'high' = 3, 'urgent' = 4 ),
    meta_max_retries UInt8,
    meta_inserted_at DateTime64(3, 'UTC') CODEC(Delta, ZSTD)
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(meta_inserted_at)
ORDER BY (
    workspace_id,
    project_id,
    meta_inserted_at,
    event_type,
    event_id
)
TTL meta_inserted_at + INTERVAL 30 DAY
SETTINGS index_granularity = 8192;
