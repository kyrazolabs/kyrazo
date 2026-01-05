CREATE TABLE IF NOT EXISTS routed_events (
    route_id String PRIMARY KEY,
    workspace_id String,
    user_id String,
    webhook_id String,
    target_url String,
    -- name String,
    -- description String,
    -- is_active UInt8,
    -- secret String,
    created_at DateTime64(3, 'UTC'),
    updated_at DateTime64(3, 'UTC')
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (route_id, workspace_id);
