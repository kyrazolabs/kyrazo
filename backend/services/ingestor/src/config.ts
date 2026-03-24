export class Config {
    private static instance: Config;

    readonly port = parseInt(process.env.PORT || '3000', 10);
    readonly snapshotRedisUrl = process.env.SNAPSHOT_REDIS_URL || process.env.REDIS_URL!;
    readonly snapshotRedisTls = process.env.SNAPSHOT_REDIS_TLS === 'true' || process.env.REDIS_TLS === 'true' || process.env.NODE_ENV === 'production';
    readonly streamRedisUrl = process.env.STREAM_REDIS_URL || process.env.REDIS_URL!;
    readonly streamRedisTls = process.env.STREAM_REDIS_TLS === 'true' || process.env.REDIS_TLS === 'true' || process.env.NODE_ENV === 'production';
    readonly pgUrl = process.env.DATABASE_URL!;
    readonly pgSsl = process.env.POSTGRES_SSL === 'true' || process.env.NODE_ENV === 'production';
    readonly pgSslMode = process.env.POSTGRES_SSL_MODE || 'require';
    readonly pgCaFile = process.env.POSTGRES_CA_FILE;
    readonly snapshotIntervalMs = 5000;
    
    // Stream configuration
    readonly streamBatchCount = parseInt(process.env.STREAM_BATCH_COUNT || '1000', 10);
    readonly streamBlockMs = parseInt(process.env.STREAM_BLOCK_MS || '1000', 10);
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
