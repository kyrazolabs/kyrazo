CREATE TABLE IF NOT EXISTS delivery_attempts (
    delivery_id UUID DEFAULT generateUUIDv4(),
    workspace_id String,
    project_id String CODEC(ZSTD(3)),
    producer_id String,
    source_type String,

    -- Links to the other collections
    event_id String,
    event_type String,
    event_model Enum8('PublishedEvent' = 1, 'ReceivedEvent' = 2, 'RoutedEvent' = 3),
    source_id String,
    endpoint_id Nullable(String),
    target String,

    -- Status of this specific delivery attempt
    status Enum8('pending' = 1, 'processing' = 2, 'delivered' = 3, 'failed' = 4, 'timeout' = 5, 'network_error' = 6),
    attempt_number UInt16,

    -- Request details
    request_method String CODEC(ZSTD),
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
    INDEX idx_source_type (source_type) TYPE set(0) GRANULARITY 1
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(scheduled_at)
ORDER BY (delivery_id, workspace_id, project_id, event_id)
PRIMARY KEY (delivery_id);


CREATE TABLE IF NOT EXISTS published_events (
    event_id UUID,
    workspace_id String,
    project_id String CODEC(ZSTD(3)),
    source_id String,
    producer_id String,
    event_type String,

    timestamp UInt8,
    data String, -- Storing as JSON string

    delivered_all UInt8,

    meta_priority Enum8( 'low' = 1, 'normal' = 2, 'high' = 3, 'urgent' = 4 ),
    meta_max_retries UInt8,
    meta_inserted_at DateTime64(3, 'UTC'),
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(meta_inserted_at)
ORDER BY (event_id, workspace_id, project_id, source_id)
PRIMARY KEY (event_id);

CREATE TABLE IF NOT EXISTS published_event_targets (
    event_id String,
    target_id String,
    target_url String,
    status Enum8( 'pending' = 1, 'processing' = 2, 'delivered' = 3, 'failed' = 4, 'timeout' = 5, 'network_error' = 6 ), 
)
ENGINE = MergeTree()
ORDER BY (event_id, target_id);

CREATE TABLE IF NOT EXISTS ingest_events (
    event_id UUID DEFAULT generateUUIDv4(),
    source_id String CODEC(ZSTD(3)),
    workspace_id String CODEC(ZSTD(3)),
    project_id String CODEC(ZSTD(3)),
    user_id String CODEC(ZSTD(3)),
    ingress_id String CODEC(ZSTD(3)),
    source LowCardinality(String) CODEC(ZSTD(3)),

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
ORDER BY (event_id, workspace_id, project_id, received_at)
PRIMARY KEY (event_id)
TTL created_at + INTERVAL 90 DAY DELETE;


CREATE TABLE IF NOT EXISTS routed_events (
    route_id UUID DEFAULT generateUUIDv4(),
    workspace_id String,
    project_id String CODEC(ZSTD(3)),
    user_id String,
    source_id String,
    target_url String,
    name String,
    description String,
    is_active UInt8,
    secret String,
    created_at DateTime64(3),
    updated_at DateTime64(3),
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (route_id, workspace_id, project_id)
PRIMARY KEY (route_id);


