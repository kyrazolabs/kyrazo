import Redis from 'ioredis';
import { Config } from '../config';
import { DispatchAggregator } from '../aggregators/dispatch.aggregator';
import { IngestAggregator } from '../aggregators/ingest.aggregator';

export class RedisSnapshotConsumer {
    private redis: Redis;
    private timer?: Timer;

    // Lua script to atomically get all fields and delete the key
    private readonly luaScript = `
        local data = redis.call("HGETALL", KEYS[1])
        if #data > 0 then
            redis.call("DEL", KEYS[1])
        end
        return data
    `;

    constructor(
        private dispatchAgg: DispatchAggregator,
        private ingestAgg: IngestAggregator,
        redisClient?: Redis
    ) {
        this.redis = redisClient || new Redis(Config.get().redisUrl);
        // Define the custom command to make it easier to call
        // Check if defineCommand exists (mock might not have it or needs it)
        if (typeof this.redis.defineCommand === 'function') {
            this.redis.defineCommand('getdelall', {
                numberOfKeys: 1,
                lua: this.luaScript,
            });
        }
    }

    start() {
        console.log('🚀 Redis Snapshot Consumer started...');
        this.timer = setInterval(
            () => this.consume(),
            Config.get().snapshotIntervalMs
        );
    }

    async consume() {
        return new Promise<void>((resolve, reject) => {
            const stream = this.redis.scanStream({
                match: 'analytics:rt:*',
                count: 100, // Process in chunks of 100 keys
            });

            const dispatchBatch: Record<string, string>[] = [];
            const ingestBatch: Record<string, string>[] = [];

            stream.on('data', async (keys: string[]) => {
                stream.pause(); // Pause scanning while we process this chunk

                if (keys.length > 0) {
                    const pipeline = this.redis.pipeline();

                    // @ts-expect-error - getdelall is a custom command defined in constructor
                    keys.forEach(key => pipeline.getdelall(key));

                    const results = await pipeline.exec();

                    if (results) {
                        results.forEach((result, index) => {
                            const [err, rawData] = result;
                            if (
                                err ||
                                !rawData ||
                                !Array.isArray(rawData) ||
                                rawData.length === 0
                            )
                                return;

                            // Convert Redis HGETALL array response ['key', 'value', 'key2', 'value2'] to object
                            const data: Record<string, string> = {};
                            for (let i = 0; i < rawData.length; i += 2) {
                                data[rawData[i] as string] = rawData[
                                    i + 1
                                ] as string;
                            }

                            // Attach the key itself for parsing context later if needed (e.g. valid timestamps in key)
                            // key format: analytics:rt:{projectId}:{type}:{minuteBucket}:...
                            const key = keys[index];
                            if (!key) return;

                            data['_key'] = key;

                            const keyParts = key.split(':');
                            // keyParts[0] = analytics
                            // keyParts[1] = rt
                            // keyParts[2] = projectId
                            // keyParts[3] = type (dispatch | ingest)

                            if (keyParts[3] === 'dispatch') {
                                dispatchBatch.push(data);
                            } else if (keyParts[3] === 'ingest') {
                                ingestBatch.push(data);
                            }
                        });
                    }
                }

                stream.resume();
            });

            stream.on('end', async () => {
                try {
                    if (dispatchBatch.length > 0) {
                        console.log(
                            `Processing ${dispatchBatch.length} dispatch events`
                        );
                        await this.dispatchAgg.aggregateMany(dispatchBatch);
                    }
                    if (ingestBatch.length > 0) {
                        console.log(
                            `Processing ${ingestBatch.length} ingest events`
                        );
                        await this.ingestAgg.aggregateMany(ingestBatch);
                    }
                    resolve();
                } catch (err) {
                    reject(err);
                }
            });

            stream.on('error', err => {
                reject(err);
            });
        });
    }
}
