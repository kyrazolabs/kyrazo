export class Config {
    private static instance: Config;

    readonly port = parseInt(process.env.PORT || '3000', 10);
    readonly snapshotRedisUrl = process.env.SNAPSHOT_REDIS_URL || process.env.REDIS_URL!;
    readonly streamRedisUrl = process.env.STREAM_REDIS_URL || process.env.REDIS_URL!;
    readonly pgUrl = process.env.DATABASE_URL!;
    readonly snapshotIntervalMs = 5000;
    
    // Stream configuration
    readonly streamBatchCount = process.env.STREAM_BATCH_COUNT || '1000';
    readonly streamBlockMs = process.env.STREAM_BLOCK_MS || '1000';
    readonly streamMaxIdleMs = parseInt(process.env.STREAM_MAX_IDLE_MS || '60000', 10);
    readonly streamMaxRetries = parseInt(process.env.STREAM_MAX_RETRIES || '3', 10);

    private constructor() {}

    static get(): Config {
        if (!Config.instance) {
            Config.instance = new Config();
        }
        return Config.instance;
    }
}
