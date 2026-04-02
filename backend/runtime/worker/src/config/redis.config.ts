import Redis, { type RedisOptions } from 'ioredis';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

import { config } from '@/config';
import { logger } from '@kyrazo/shared';

dotenv.config();

/**
 * @title RedisConfig
 * @description Singleton class for managing Redis connections and common operations, including caching, health checks, and queue support.
 *
 * @example
 * const redis = RedisConfig.getInstance();
 * await redis.connect();
 * await redis.set('key', 'value', 60);
 * const value = await redis.get('key');
 */
export class RedisConfig {
    private static instance: RedisConfig;
    public client: Redis | null = null;
    private queueClient: Redis | null = null;
    private streamClient: Redis | null = null;
    private isConnected = false;

    /**
     * @title RedisConfig Constructor
     * @description Private constructor to enforce singleton pattern.
     */
    private constructor() {}

    /**
     * @title Get RedisConfig Instance
     * @description Returns the singleton instance of RedisConfig.
     * @returns {RedisConfig} The singleton instance.
     * @example
     * const redis = RedisConfig.getInstance();
     */
    public static getInstance(): RedisConfig {
        if (!RedisConfig.instance) {
            RedisConfig.instance = new RedisConfig();
        }
        return RedisConfig.instance;
    }

    /**
     * @title Connect to Redis
     * @description Establishes connections to the main Redis client and the queue client (for BullMQ).
     * @returns {Promise<void>} Resolves when both clients are connected.
     * @example
     * await redis.connect();
     */
    public async connect(): Promise<void> {
        if (
            this.isConnected &&
            this.client?.status === 'ready' &&
            this.queueClient?.status === 'ready' &&
            this.streamClient?.status === 'ready'
        ) {
            logger.info('Redis already connected');
            return;
        }

        try {
            // Main Redis client for general operations
            let redisClientOptions: RedisOptions = {};
            if (!config.redis.url) {
                redisClientOptions = {
                    host: config.redis.host,
                    port: config.redis.port,
                    db: config.redis.db,
                    password: config.redis.password,
                } as RedisOptions;
            }

            redisClientOptions.maxRetriesPerRequest = null; // Essential for BullMQ

            // Add TLS options if enabled
            if (config.redis.tls) {
                redisClientOptions.tls = {
                    rejectUnauthorized: true,
                };
                if (config.redis.caFile && fs.existsSync(config.redis.caFile)) {
                    redisClientOptions.tls.ca = fs.readFileSync(config.redis.caFile);
                }
                if (config.redis.certFile && fs.existsSync(config.redis.certFile)) {
                    redisClientOptions.tls.cert = fs.readFileSync(config.redis.certFile);
                }
                if (config.redis.keyFile && fs.existsSync(config.redis.keyFile)) {
                    redisClientOptions.tls.key = fs.readFileSync(config.redis.keyFile);
                }
                // Skip hostname identity check for IP-based certificates
                (redisClientOptions.tls as any).checkServerIdentity = () => undefined;
            }

            this.client = config.redis.url ? new Redis(config.redis.url, redisClientOptions) : new Redis(redisClientOptions);

            let queueRedisClientOptions: RedisOptions = {};
            if (!config.redis.queue.url) {
                queueRedisClientOptions = {
                    host: config.redis.queue.host || config.redis.host,
                    port: config.redis.queue.port || config.redis.port,
                    password: config.redis.queue.password || config.redis.password,
                    db: config.redis.queue.db || config.redis.db,
                } as RedisOptions;
            }

            queueRedisClientOptions.maxRetriesPerRequest = null; // Essential for BullMQ

            // Add TLS options if enabled for queue
            if (config.redis.queue.tls) {
                queueRedisClientOptions.tls = {
                    rejectUnauthorized: true,
                };
                if (config.redis.queue.caFile && fs.existsSync(config.redis.queue.caFile)) {
                    queueRedisClientOptions.tls.ca = fs.readFileSync(config.redis.queue.caFile);
                }
                if (config.redis.queue.certFile && fs.existsSync(config.redis.queue.certFile)) {
                    queueRedisClientOptions.tls.cert = fs.readFileSync(config.redis.queue.certFile);
                }
                if (config.redis.queue.keyFile && fs.existsSync(config.redis.queue.keyFile)) {
                    queueRedisClientOptions.tls.key = fs.readFileSync(config.redis.queue.keyFile);
                }
                // Skip hostname identity check for IP-based certificates
                (queueRedisClientOptions.tls as any).checkServerIdentity = () => undefined;
            }
            this.queueClient = config.redis.queue.url ? new Redis(config.redis.queue.url, queueRedisClientOptions) : new Redis(queueRedisClientOptions);

            let streamRedisClientOptions: RedisOptions = {};
            if (!config.redis.stream.url) {
                streamRedisClientOptions = {
                    host: config.redis.stream.host || config.redis.host,
                    port: config.redis.stream.port || config.redis.port,
                    password: config.redis.stream.password || config.redis.password,
                    db: config.redis.stream.db || config.redis.db,
                } as RedisOptions;
            }

            streamRedisClientOptions.maxRetriesPerRequest = null;

            // Add TLS options if enabled for stream
            if (config.redis.stream.tls) {
                streamRedisClientOptions.tls = {
                    rejectUnauthorized: true,
                };
                if (config.redis.stream.caFile && fs.existsSync(config.redis.stream.caFile)) {
                    streamRedisClientOptions.tls.ca = fs.readFileSync(config.redis.stream.caFile);
                }
                if (config.redis.stream.certFile && fs.existsSync(config.redis.stream.certFile)) {
                    streamRedisClientOptions.tls.cert = fs.readFileSync(config.redis.stream.certFile);
                }
                if (config.redis.stream.keyFile && fs.existsSync(config.redis.stream.keyFile)) {
                    streamRedisClientOptions.tls.key = fs.readFileSync(config.redis.stream.keyFile);
                }
                // Skip hostname identity check for IP-based certificates
                (streamRedisClientOptions.tls as any).checkServerIdentity = () => undefined;
            }
            this.streamClient = config.redis.stream.url ? new Redis(config.redis.stream.url, streamRedisClientOptions) : new Redis(streamRedisClientOptions);

            // Set up error handlers
            this.client.on('error', (error: Error) => {
                logger.error('Redis client error:', error);
                this.isConnected = false;
            });

            this.queueClient.on('error', (error: Error) => {
                logger.error('Redis queue client error:', error);
            });

            this.client.on('connect', () => {
                logger.info('Redis client connected');
            });

            this.queueClient.on('connect', () => {
                logger.info('Redis queue client connected');
            });

            this.streamClient.on('connect', () => {
                logger.info('Redis stream client connected');
            });

            this.client.on('disconnect', () => {
                logger.warn('Redis client disconnected');
                this.isConnected = false;
            });

            this.client.on('reconnecting', () => {
                logger.info('Redis client reconnecting');
            });

            // Wait for both clients to be ready
            await Promise.all([
                new Promise<void>((resolve, reject) => {
                    const onReady = () => {
                        this.client?.off('error', onError);
                        resolve();
                    };
                    const onError = (err: Error) => {
                        this.client?.off('ready', onReady);
                        reject(err);
                    };

                    if (this.client?.status === 'ready') {
                        resolve();
                    } else {
                        this.client?.once('ready', onReady);
                        this.client?.once('error', onError);
                    }
                }),
                new Promise<void>((resolve, reject) => {
                    const onReady = () => {
                        this.queueClient?.off('error', onError);
                        resolve();
                    };
                    const onError = (err: Error) => {
                        this.queueClient?.off('ready', onReady);
                        reject(err);
                    };

                    if (this.queueClient?.status === 'ready') {
                        resolve();
                    } else {
                        this.queueClient?.once('ready', onReady);
                        this.queueClient?.once('error', onError);
                    }
                }),
                new Promise<void>((resolve, reject) => {
                    const onReady = () => {
                        this.streamClient?.off('error', onError);
                        resolve();
                    };
                    const onError = (err: Error) => {
                        this.streamClient?.off('ready', onReady);
                        reject(err);
                    };

                    if (this.streamClient?.status === 'ready') {
                        resolve();
                    } else {
                        this.streamClient?.once('ready', onReady);
                        this.streamClient?.once('error', onError);
                    }
                }),
            ]);

            this.isConnected = true;
            logger.info('Connected to Redis successfully');
        } catch (error: any) {
            logger.error('Failed to connect to Redis:', error);
            this.isConnected = false;
            throw error;
        }
    }

    /**
     * @title Disconnect from Redis
     * @description Gracefully disconnects both the main and queue Redis clients.
     * @returns {Promise<void>} Resolves when both clients are disconnected.
     * @example
     * await redis.disconnect();
     */
    public async disconnect(): Promise<void> {
        try {
            const promises = [];

            if (this.client && this.client.status === 'ready') {
                promises.push(this.client.quit());
            }

            if (this.queueClient && this.queueClient.status === 'ready') {
                promises.push(this.queueClient.quit());
            }

            await Promise.all(promises);

            this.client = null;
            this.queueClient = null;
            this.isConnected = false;

            logger.info('Disconnected from Redis');
        } catch (error: any) {
            logger.error('Error disconnecting from Redis:', error);
            throw error;
        }
    }

    /**
     * @title Get Main Redis Client
     * @description Returns the main Redis client instance. Throws if not connected.
     * @returns {Redis} The main Redis client.
     * @throws {Error} If the client is not connected.
     * @example
     * const client = redis.getClient();
     */
    public getClient(): Redis {
        if (!this.client || this.client.status !== 'ready') {
            throw new Error('Redis client is not connected');
        }
        return this.client;
    }

    /**
     * @title Get Queue Redis Client
     * @description Returns the queue Redis client instance. Throws if not connected.
     * @returns {Redis} The queue Redis client.
     * @throws {Error} If the queue client is not connected.
     * @example
     * const queueClient = redis.getQueueClient();
     */
    public getQueueClient(): Redis {
        if (!this.queueClient || this.queueClient.status !== 'ready') {
            throw new Error('Redis queue client is not connected');
        }
        return this.queueClient;
    }

    /**
     * @title Get Stream Redis Client
     * @description Returns the stream Redis client instance. Throws if not connected.
     * @returns {Redis} The stream Redis client.
     * @throws {Error} If the stream client is not connected.
     * @example
     * const streamClient = redis.getStreamClient();
     */
    public getStreamClient(): Redis {
        if (!this.streamClient || this.streamClient.status !== 'ready') {
            throw new Error('Redis stream client is not connected');
        }
        return this.streamClient;
    }

    /**
     * @title Get Connection Status
     * @description Checks if the main Redis client is connected and open.
     * @returns {boolean} True if connected, false otherwise.
     * @example
     * const isConnected = redis.getConnectionStatus();
     */
    public getConnectionStatus(): boolean {
        return this.isConnected && !!this.client && this.client.status === 'ready';
    }

    /**
     * @title Health Check
     * @description Performs a health check on the main Redis client, returning status and details.
     * @returns {Promise<{ status: string; details: any }>} Health status and details.
     * @example
     * const health = await redis.healthCheck();
     */
    public async healthCheck(): Promise<{ status: string; details: any }> {
        try {
            if (!this.client || this.client.status !== 'ready') {
                return {
                    status: 'unhealthy',
                    details: {
                        connected: false,
                        error: 'Client not connected',
                    },
                };
            }

            const ping = await this.client.ping();
            const info = await this.client.info('server');

            return {
                status: 'healthy',
                details: {
                    connected: this.isConnected,
                    ping,
                    serverInfo: info.split('\r\n').slice(0, 5).join('\n'),
                },
            };
        } catch (error: any) {
            return {
                status: 'unhealthy',
                details: {
                    connected: this.isConnected,
                    error: error instanceof Error ? error.message : 'Unknown error',
                },
            };
        }
    }

    /**
     * @title Set Value in Redis
     * @description Sets a value in Redis with an optional TTL (in seconds).
     * @param {string} key - The Redis key.
     * @param {string} value - The value to store.
     * @param {number} [ttl] - Optional time-to-live in seconds.
     * @returns {Promise<void>} Resolves when the value is set.
     * @example
     * await redis.set('user:1', 'data', 60);
     */
    public async set(key: string, value: string, ttl?: number): Promise<void> {
        const client = this.getClient();
        if (ttl) {
            await client.setex(key, ttl, value);
        } else {
            await client.set(key, value);
        }
    }

    /**
     * @title Get Value from Redis
     * @description Retrieves a value from Redis by key.
     * @param {string} key - The Redis key.
     * @returns {Promise<string | null>} The value, or null if not found.
     * @example
     * const value = await redis.get('user:1');
     */
    public async get(key: string): Promise<string | null> {
        const client = this.getClient();
        return await client.get(key);
    }

    /**
     * @title Cache Get or Set
     * @description Gets a value from Redis if it exists, otherwise calls the callback to get fresh data, sets it in Redis, and returns it. Value is JSON-stringified when set and parsed when returned.
     * @param {string} key - The Redis key.
     * @param {() => Promise<T>} cb - Callback to fetch fresh data if not cached.
     * @param {number} [ttl] - Optional time-to-live in seconds (default: 3600).
     * @returns {Promise<T>} The cached or fresh value.
     * @template T
     * @example
     * const data = await redis.cache('user:1', async () => fetchUser(), 60);
     */
    public async cache<T>(key: string, cb: () => Promise<T>, ttl?: number): Promise<T> {
        const client = this.getClient();
        const value = await client.get(key);
        
        if (value !== null && value !== 'null') {
            try {
                return JSON.parse(value) as T;
            } catch (e) {
                // If parsing fails, ignore and fetch fresh data
            }
        }
        
        const freshData = await cb();
        
        if (freshData !== null && freshData !== undefined) {
            await client.setex(key, ttl ?? 3600, JSON.stringify(freshData));
        }
        
        return freshData;
    }

    /**
     * @title Delete Key from Redis
     * @description Deletes a key from Redis.
     * @param {string} key - The Redis key to delete.
     * @returns {Promise<number>} The number of keys deleted.
     * @example
     * await redis.del('user:1');
     */
    public async del(key: string): Promise<number> {
        const client = this.getClient();
        return await client.del(key);
    }

    /**
     * @title Check Key Existence
     * @description Checks if a key exists in Redis.
     * @param {string} key - The Redis key to check.
     * @returns {Promise<number>} 1 if the key exists, 0 otherwise.
     * @example
     * const exists = await redis.exists('user:1');
     */
    public async exists(key: string): Promise<number> {
        const client = this.getClient();
        return await client.exists(key);
    }

    /**
     * @title Set Key Expiration
     * @description Sets an expiration time (in seconds) for a key in Redis.
     * @param {string} key - The Redis key.
     * @param {number} seconds - Expiration time in seconds.
     * @returns {Promise<boolean>} True if the timeout was set, false otherwise.
     * @example
     * await redis.expire('user:1', 120);
     */
    public async expire(key: string, seconds: number): Promise<number> {
        const client = this.getClient();
        return await client.expire(key, seconds);
    }
}

export const REDIS_KEYS = {
    targetHash: (eventId: string, eventType: string, targetId: string) =>
        `wh:evt:${eventId}:et:${eventType}:tg:${targetId}`,
    eventDeliveredCount: (eventId: string) => `wh:evt:${eventId}:deliv_count`,
    eventTotal: (eventId: string) => `wh:evt:${eventId}:total`,
    dirtyZset: 'wh:dirty', // لتتبع التحديثات
};

/**
 * @title redisConfig Singleton
 * @description Exported singleton instance of RedisConfig for use throughout the application.
 * @example
 * import { redisConfig } from './redis';
 * await redisConfig.connect();
 */
export const redisConfig = RedisConfig.getInstance();
