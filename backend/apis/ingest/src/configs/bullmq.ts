import { Redis } from 'ioredis';
import * as fs from 'fs';
import type { QueueOptions } from 'bullmq';
import * as queuesName from '@/producers/constants/constants.bullmq';
import * as queues from '@/producers/queues/queues.bullmq';
import config from './app';

export class BullmqConfig {
    private static instance: BullmqConfig;
    private redisUrl: string | undefined;
    private redisOptions: any;
    private bullmqOptions: QueueOptions;
    public redisClient: Redis;

    constructor() {
        if (config.redis.queue.url) {
            this.redisUrl = config.redis.queue.url;
            const options: any = {
                maxRetriesPerRequest: null,
                enableOfflineQueue: true,
                reconnectOnError: (err: Error) => {
                    const targetError = 'READONLY';
                    const isRecoverable = err.message.includes(targetError);
                    if (isRecoverable) {
                        console.warn('[Redis BullMQ] Reconnecting due to READONLY error.');
                    }
                    return isRecoverable;
                },
            };

            if (config.redis.tls) {
                options.tls = {
                    rejectUnauthorized: true,
                    checkServerIdentity: () => undefined,
                };
                if (config.redis.queue.caFile && fs.existsSync(config.redis.queue.caFile)) {
                    options.tls.ca = fs.readFileSync(config.redis.queue.caFile);
                }
                if (config.redis.queue.certFile && fs.existsSync(config.redis.queue.certFile)) {
                    options.tls.cert = fs.readFileSync(config.redis.queue.certFile);
                }
                if (config.redis.queue.keyFile && fs.existsSync(config.redis.queue.keyFile)) {
                    options.tls.key = fs.readFileSync(config.redis.queue.keyFile);
                }
            }

            this.redisClient = new Redis(this.redisUrl!, options);
        } else {
            this.redisOptions = {
                host: config.redis.queue.host,
                port: config.redis.queue.port,
                password: config.redis.queue.password,
                db: config.redis.queue.db,
            };

            const options: any = {
                ...this.redisOptions,
                maxRetriesPerRequest: null,
                enableOfflineQueue: true,
            };

            if (config.redis.tls) {
                options.tls = {
                    rejectUnauthorized: true,
                    checkServerIdentity: () => undefined,
                };
                if (config.redis.queue.caFile && fs.existsSync(config.redis.queue.caFile)) {
                    options.tls.ca = fs.readFileSync(config.redis.queue.caFile);
                }
                if (config.redis.queue.certFile && fs.existsSync(config.redis.queue.certFile)) {
                    options.tls.cert = fs.readFileSync(config.redis.queue.certFile);
                }
                if (config.redis.queue.keyFile && fs.existsSync(config.redis.queue.keyFile)) {
                    options.tls.key = fs.readFileSync(config.redis.queue.keyFile);
                }
            }

            this.redisClient = new Redis(options);
        }

        this.redisClient.on('connect', () => {
            console.info('[Redis BullMQ] Connection established');
        });

        this.redisClient.on('ready', () => {
            console.info('[Redis BullMQ] Client ready to use');
        });

        this.redisClient.on('error', err => {
            console.error('[Redis BullMQ] Redis error:', err);
        });

        this.redisClient.on('reconnecting', () => {
            console.info('[Redis BullMQ] Attempting to reconnect...');
        });

        this.redisClient.on('end', () => {
            console.info('[Redis BullMQ] Connection closed');
        });
        this.bullmqOptions = {
            connection: this.redisClient,
            prefix: 'mailq',
            defaultJobOptions: {
                attempts: 10, // 10 retry
                backoff: {
                    type: 'exponential',
                    delay: 5000, // retry after 5s, 10s, 20s
                },
                removeOnComplete: true,
                removeOnFail: false, // Keep failed jobs to be handled later
            },
        };
    }

    public static getInstance(): BullmqConfig {
        if (!BullmqConfig.instance) {
            BullmqConfig.instance = new BullmqConfig();
        }
        return BullmqConfig.instance;
    }

    public getQueueNames() {
        return queuesName;
    }
    public getQueues() {
        return queues.bullmqQueues(this.bullmqOptions);
    }

    public getRedisClient() {
        return this.redisClient;
    }
}

export const bullmqConfig = BullmqConfig.getInstance();
