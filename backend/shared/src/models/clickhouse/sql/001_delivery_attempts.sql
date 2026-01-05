CREATE TABLE IF NOT EXISTS delivery_attempts (
    delivery_id UUID CODEC(ZSTD(3)),
    workspace_id LowCardinality(String),
    project_id   LowCardinality(String),

    -- Links to other tables
    event_id   UUID,
    event_type LowCardinality(String),

    -- Source (if forwarded)
    source_id   LowCardinality(Nullable(String)),
    source_type LowCardinality(Nullable(String)),

    -- Target
    target_id  LowCardinality(String),
    target_url String CODEC(ZSTD(3)),

    -- Status of this specific delivery attempt
    status Enum8('pending' = 1, 'processing' = 2, 'delivered' = 3, 'failed' = 4, 'timeout' = 5, 'network_error' = 6),
    attempt_number UInt16,

    -- Request
    request_header String CODEC(ZSTD(5)),
    request_body   String CODEC(ZSTD(5)),

    -- Response
    response_code    Nullable(UInt16),
    response_header  String CODEC(ZSTD(5)),
    response_body    String CODEC(ZSTD(5)),
    response_time_ms Nullable(UInt32),

    -- Timing
    scheduled_at DateTime64(3, 'UTC') CODEC(Delta, ZSTD),
    processed_at Nullable(DateTime64(3, 'UTC')) CODEC(Delta, ZSTD),

    error Nullable(String) CODEC(ZSTD(5)),

    -- Secondary indexes
    INDEX idx_status status TYPE set(0) GRANULARITY 4,
    INDEX idx_source_type source_type TYPE set(0) GRANULARITY 4
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(scheduled_at)
ORDER BY (
    workspace_id,
    project_id,
    scheduled_at,
    status,
    event_id,
    delivery_id
)
TTL scheduled_at + INTERVAL 30 DAY
SETTINGS index_granularity = 8192;
