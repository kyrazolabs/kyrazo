CREATE TABLE IF NOT EXISTS published_event_targets (
    event_id String PRIMARY KEY,
    target_id String,
    target_url String,
    status Enum8( 'pending' = 1, 'processing' = 2, 'delivered' = 3, 'failed' = 4, 'timeout' = 5, 'network_error' = 6 ), 
)
ENGINE = MergeTree()
ORDER BY (event_id, target_id);
