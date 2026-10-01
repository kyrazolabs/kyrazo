CREATE TABLE IF NOT EXISTS delivery_attempts (
    delivery_id String PRIMARY KEY,
    workspace_id String,
    producer_id String,
    webhook_type String,

    -- Links to the other collections
    event_id String,
    webhook_id String,
    endpoint_id Nullable(String),
    target String,

    -- Status of this specific delivery attempt
    status Enum8('pending' = 1, 'processing' = 2, 'delivered' = 3, 'failed' = 4, 'timeout' = 5, 'network_error' = 6),
    attempt_number UInt16,

    -- Request details
    request_header String CODEC(ZSTD),
    request_body String CODEC(ZSTD),

    -- response details
    response_code Nullable(UInt16),
    response_header String CODEC(ZSTD),
    response_body String CODEC(ZSTD),
    response_time_ms Nullable(UInt32),

    -- Timestamps
    scheduled_at DateTime64(3, 'UTC'),
    processed_at Nullable(DateTime64(3, 'UTC')),

    error Nullable(String) CODEC(ZSTD),

    INDEX idx_status (status) TYPE set(0) GRANULARITY 1,
    INDEX idx_webhook_type (webhook_type) TYPE set(0) GRANULARITY 1
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(scheduled_at)
ORDER BY (delivery_id, event_id, workspace_id);