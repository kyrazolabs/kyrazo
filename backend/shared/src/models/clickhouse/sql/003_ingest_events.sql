CREATE TABLE IF NOT EXISTS ingest_events (
    event_id UUID CODEC(ZSTD(3)),
    workspace_id LowCardinality(String),
    project_id   LowCardinality(String),
    user_id      LowCardinality(String),

    source_id    LowCardinality(String),
    source_type  LowCardinality(String),
    ingress_id   LowCardinality(String),

    -- Timing
    received_at DateTime64(3, 'UTC') CODEC(Delta, ZSTD),
    created_at  DateTime64(3, 'UTC') CODEC(Delta, ZSTD),
    processed_at  DateTime64(3, 'UTC') CODEC(Delta, ZSTD),

    -- Provider
    provider              LowCardinality(String),
    provider_event_id     String CODEC(ZSTD(3)),
    provider_resource_id  String CODEC(ZSTD(3)),

    -- Payload
    headers String CODEC(ZSTD(5)),
    body    String CODEC(ZSTD(5)),

    verified Bool,

    processing_status Enum8('pending' = 1, 'processed' = 2, 'failed' = 3),
    processing_error Nullable(String) CODEC(ZSTD(5)),

    associated_event_id Nullable(UUID)
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(created_at)
ORDER BY (
    workspace_id,
    project_id,
    created_at,
    processing_status,
    event_id
)
TTL created_at + INTERVAL 90 DAY
SETTINGS index_granularity = 8192;
