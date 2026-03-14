export class Config {
    private static instance: Config;

    readonly port = parseInt(process.env.PORT || '3000', 10);
    readonly redisUrl = process.env.REDIS_URL!;
    readonly pgUrl = process.env.DATABASE_URL!;
    readonly snapshotIntervalMs = 5000;

    private constructor() {}

    static get(): Config {
        if (!Config.instance) {
            Config.instance = new Config();
        }
        return Config.instance;
    }
}
