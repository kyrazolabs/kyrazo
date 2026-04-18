import { redisConfig } from '@/config';
import { logger, RedisKeys, unprefixId, S3Bucket } from '@kyrazo/shared';
import dayjs from 'dayjs';
import { s3Service } from '@/services/storage/s3.service';
import { Queue, Worker, Job } from 'bullmq';

export class S3Transport {
    private static instance: S3Transport;
    private flushQueue: Queue | undefined;
    private flushWorker: Worker | undefined;

    private constructor() {}

    public static getInstance(): S3Transport {
        if (!S3Transport.instance) {
            S3Transport.instance = new S3Transport();
        }
        return S3Transport.instance;
    }

    public async initialize(): Promise<void> {
        const connection = redisConfig.getQueueClient();
        
        this.flushQueue = new Queue('{s3-flush}', { connection });
        
        this.flushWorker = new Worker('{s3-flush}', this.processFlush.bind(this), {
            connection,
            concurrency: 5,
        });

        // Add repeatable job to check for batches to flush every minute
        // We use a single job that scans for all active batches
        await this.flushQueue.add('check-batches', {}, {
            repeat: {
                pattern: '* * * * *', // Every minute
            },
            jobId: 's3-batch-checker',
        });

        logger.info('🚀 S3 Transport (Batching) initialized');
    }

    /**
     * Push event to Redis buffer for 1-minute batching
     */
    public async buffer(event: any, targetConfig: any): Promise<void> {
        const destId = unprefixId(targetConfig.id || targetConfig._id);
        if (!destId) {
            logger.error('[S3Transport] Cannot buffer event, destination ID is missing');
            return;
        }

        const now = dayjs();
        const hourBucket = now.format('YYYY-MM-DD-HH');
        
        const batchKey = RedisKeys.storage.s3Batch(destId, hourBucket);
        
        const payload = JSON.stringify(event);
        
        // Push to Redis List
        await redisConfig.getQueueClient().rpush(batchKey, payload);
    }

    /**
     * Process the flush job
     */
    private async processFlush(job: Job): Promise<void> {
        try {
            // In a real high-scale scenario, we would track "active" batches in a Set
            // For now, we'll scan or use the provided job data if we triggered specific flushes
            // Since this is a repeatable "checker", let's find all storage:batch:s3:* keys
            
            const redis = redisConfig.getQueueClient();
            const keys = await redis.keys('storage:batch:s3:*');
            
            for (const key of keys) {
                await this.flushBatch(key);
            }
        } catch (error: any) {
            logger.error(`[S3Transport] Global flush failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Flush a specific batch to S3
     */
    private async flushBatch(batchKey: string): Promise<void> {
        const redis = redisConfig.getQueueClient();
        
        // storage:batch:s3:${destId}:${hourBucket}
        const parts = batchKey.split(':');
        const destId = parts[3];
        const hourBucket = parts[4];

        if (!destId || !hourBucket) {
            logger.error(`[S3Transport] Invalid batch key format: ${batchKey}`);
            return;
        }

        // Distributed Lock to prevent duplicate flushes from multiple instances
        const lockKey = `${batchKey}:lock`;
        const lock = await redis.set(lockKey, 'locked', 'EX', 55, 'NX');
        if (!lock) return;

        try {
            // Get all items and clear list atomically
            // Optimization: RENAME batchKey to a temp key then process temp key
            const tempKey = `${batchKey}:processing:${dayjs().valueOf()}`;
            const exists = await redis.exists(batchKey);
            if (!exists) return;

            await redis.rename(batchKey, tempKey);
            
            const items = await redis.lrange(tempKey, 0, -1);
            if (!items || items.length === 0) {
                await redis.del(tempKey);
                return;
            }

            // Convert to NDJSON
            const ndjson = items.join('\n');

            // Fetch destination config (cached or mongo)
            // For now assume we have it or fetch it. 
            // In actual flow, we might need to store config reference or pass it.
            // But we'll use a repository to get config by destId.
            const config = await this.getS3Config(destId);
            if (!config) {
                logger.error(`[S3Transport] Config not found for destination ${destId}`);
                // Put items back? Or send to a DLQ list.
                return;
            }

            const path = this.generateHivePath(config.namespaceId, hourBucket);
            const filename = `batch_${dayjs().valueOf()}.ndjson`;
            const fullKey = `${path}${filename}`;

            const result = await s3Service.upload(fullKey, ndjson, {
                bucket: config.bucketName,
                region: config.region,
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.secretAccessKey,
                endpoint: config.endpoint,
            });

            if (result.success) {
                await redis.del(tempKey);
                logger.info(`✅ Successfully flushed batch to S3: ${fullKey} (${items.length} events)`);
            } else {
                // Restore items if failed? Or retry later.
                // For now, rename back to retry in next cycle
                await redis.rename(tempKey, batchKey);
            }
        } catch (error: any) {
            logger.error(`[S3Transport] Failed to flush batch ${batchKey}: ${error.message}`);
        } finally {
            // Keep lock until near next minute to avoid double trigger
        }
    }

    private generateHivePath(namespaceId: string, hourBucket: string): string {
        // hourBucket is YYYY-MM-DD-HH
        const [year, month, day, hour] = hourBucket.split('-');
        return `${unprefixId(namespaceId)}/events/year=${year}/month=${month}/day=${day}/hour=${hour}/`;
    }

    private async getS3Config(destId: string): Promise<any> {
        const cacheKey = RedisKeys.context.s3Bucket(destId);
        const cached = await redisConfig.getQueueClient().get(cacheKey);
        if (cached) return JSON.parse(cached);

        const config = await S3Bucket.findById(unprefixId(destId))
            .select('+secretAccessKey +iv')
            .lean();
            
        if (config) {
            await redisConfig.getQueueClient().set(cacheKey, JSON.stringify(config), 'EX', 3600);
        }
        return config;
    }
}

export const s3Transport = S3Transport.getInstance();
