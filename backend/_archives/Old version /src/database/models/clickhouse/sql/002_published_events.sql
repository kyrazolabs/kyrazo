CREATE TABLE IF NOT EXISTS published_events (
    event_id String PRIMARY KEY,
    workspace_id String,
    webhook_id String,
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
ORDER BY (event_id, workspace_id, webhook_id);
