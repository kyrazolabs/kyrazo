import { createClient, RedisClientType } from 'redis';
import * as dotenv from 'dotenv';

import { config } from '@/config'
import { logger, safeEncode } from '@/utils';

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
  public client: RedisClientType | null = null;
  private queueClient: RedisClientType | null = null;
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
    if (this.isConnected && this.client) {
      logger.info('Redis already connected');
      return;
    }

    try {
      // Main Redis client for general operations
      let redisClientOptions: any;
      if (config.redis.url) {
        redisClientOptions = { url: config.redis.url };
      } else {
        redisClientOptions = {
          socket: {
            host: config.redis.host,
            port: config.redis.port,
          },
          database: config.redis.db,
        };
        if (config.redis.password) {
          redisClientOptions.password = config.redis.password;
        }
      }
      this.client = createClient(redisClientOptions);

      // Queue Redis client for BullMQ
      let queueRedisClientOptions: any;
      if (config.redis.queue.url) {
        queueRedisClientOptions = { url: config.redis.queue.url };
      } else {
        queueRedisClientOptions = {
          socket: {
            host: config.redis.queue.host,
            port: config.redis.queue.port,
          },
          // username: config.redis.queue,
          password: config.redis.queue.password,
          database: config.redis.queue.db,
        };
      }
      this.queueClient = createClient(queueRedisClientOptions);

      // Set up error handlers
      this.client.on('error', (error) => {
        logger.error('Redis client error:', error);
        this.isConnected = false;
      });

      this.queueClient.on('error', (error) => {
        logger.error('Redis queue client error:', error);
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        logger.warn('Redis client disconnected');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis client reconnecting');
      });

      // Connect both clients
      await Promise.all([
        this.client.connect(),
        this.queueClient.connect()
      ]);

      logger.info('Connected to Redis successfully');

    } catch (error) {
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
      
      if (this.client?.isOpen) {
        promises.push(this.client.disconnect());
      }
      
      if (this.queueClient?.isOpen) {
        promises.push(this.queueClient.disconnect());
      }

      await Promise.all(promises);
      
      this.client = null;
      this.queueClient = null;
      this.isConnected = false;
      
      logger.info('Disconnected from Redis');
    } catch (error) {
      logger.error('Error disconnecting from Redis:', error);
      throw error;
    }
  }

  /**
   * @title Get Main Redis Client
   * @description Returns the main Redis client instance. Throws if not connected.
   * @returns {RedisClientType} The main Redis client.
   * @throws {Error} If the client is not connected.
   * @example
   * const client = redis.getClient();
   */
  public getClient(): RedisClientType {
    if (!this.client || !this.client.isOpen) {
      throw new Error('Redis client is not connected');
    }
    return this.client;
  }

  /**
   * @title Get Queue Redis Client
   * @description Returns the queue Redis client instance. Throws if not connected.
   * @returns {RedisClientType} The queue Redis client.
   * @throws {Error} If the queue client is not connected.
   * @example
   * const queueClient = redis.getQueueClient();
   */
  public getQueueClient(): RedisClientType {
    if (!this.queueClient || !this.queueClient.isOpen) {
      throw new Error('Redis queue client is not connected');
    }
    return this.queueClient;
  }

  /**
   * @title Get Connection Status
   * @description Checks if the main Redis client is connected and open.
   * @returns {boolean} True if connected, false otherwise.
   * @example
   * const isConnected = redis.getConnectionStatus();
   */
  public getConnectionStatus(): boolean {
    return this.isConnected && !!this.client?.isOpen;
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
      if (!this.client || !this.client.isOpen) {
        return {
          status: 'unhealthy',
          details: {
            connected: false,
            error: 'Client not connected'
          }
        };
      }

      const ping = await this.client.ping();
      const info = await this.client.info('server');
      
      return {
        status: 'healthy',
        details: {
          connected: this.isConnected,
          ping,
          serverInfo: info.split('\r\n').slice(0, 5).join('\n')
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          connected: this.isConnected,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
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
      await client.setEx(key, ttl, value);
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
    if (value != null) {
      return JSON.parse(value) as T;
    }
    const freshData = await cb();
    await client.setEx(key, ttl ?? 3600, JSON.stringify(freshData));
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
  public async expire(key: string, seconds: number): Promise<boolean> {
    const client = this.getClient();
    return await client.expire(key, seconds);
  }
}

export const REDIS_KEYS = {
  targetHash: (eventId: string, eventType: string, targetId: string) => `wh:evt:${eventId}:et:${eventType}:tg:${targetId}`,
  eventDeliveredCount: (eventId: string) => `wh:evt:${eventId}:deliv_count`,
  eventTotal: (eventId: string) => `wh:evt:${eventId}:total`,
  dirtyZset: "wh:dirty", // لتتبع التحديثات
};

/**
 * @title redisConfig Singleton
 * @description Exported singleton instance of RedisConfig for use throughout the application.
 * @example
 * import { redisConfig } from './redis';
 * await redisConfig.connect();
 */
export const redisConfig = RedisConfig.getInstance();

