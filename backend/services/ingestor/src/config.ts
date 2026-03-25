export class Config {
    private static instance: Config;

    readonly port = parseInt(process.env.PORT || '3000', 10);
    readonly snapshotRedisUrl = process.env.SNAPSHOT_REDIS_URL || process.env.REDIS_URL!;
    readonly snapshotRedisTls = process.env.NODE_ENV === 'production';
    readonly snapshotRedisCaFile = '/etc/ssl/redis/ca.crt';
    readonly snapshotRedisCertFile = '/etc/ssl/redis/client.crt';
    readonly snapshotRedisKeyFile = '/etc/ssl/redis/client.key';
    readonly streamRedisUrl = process.env.STREAM_REDIS_URL || process.env.REDIS_URL!;
    readonly streamRedisTls = process.env.NODE_ENV === 'production';
    readonly streamRedisCaFile = '/etc/ssl/redis/ca.crt';
    readonly streamRedisCertFile = '/etc/ssl/redis/client.crt';
    readonly streamRedisKeyFile = '/etc/ssl/redis/client.key';
    readonly pgUrl = process.env.DATABASE_URL!;
    readonly pgSsl = process.env.NODE_ENV === 'production';
    readonly pgSslMode = process.env.POSTGRES_SSL_MODE || 'require';
    readonly pgCaFile = '/etc/ssl/postgres/ca.crt';
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
