import { Pool, PoolClient, QueryResult } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as fs from 'fs';
import { logger } from './logger';
import config from './app';
import * as schema from '../models/postgres/index';

/**
 * @title PostgresConfig
 * @description Singleton class for managing PostgreSQL database connections and pool.
 *
 * @example
 * const pg = PostgresConfig.getInstance();
 * await pg.connect();
 * const client = await pg.getClient();
 * const db = pg.getDrizzle();
 */
export class PostgresConfig {
    private static instance: PostgresConfig;
    private pool: Pool | null = null;
    private drizzle: NodePgDatabase<typeof schema> | null = null;
    private isConnected = false;

    /**
     * @title PostgresConfig Constructor
     * @description Private constructor to enforce singleton pattern.
     */
    private constructor() {}

    /**
     * @title Get PostgresConfig Instance
     * @description Returns the singleton instance of PostgresConfig.
     * @returns {PostgresConfig} The singleton instance.
     * @example
     * const pg = PostgresConfig.getInstance();
     */
    public static getInstance(): PostgresConfig {
        if (!PostgresConfig.instance) {
            PostgresConfig.instance = new PostgresConfig();
        }
        return PostgresConfig.instance;
    }

    /**
     * @title Connect to PostgreSQL
     * @description Initializes the PostgreSQL connection pool and tests the connection.
     * @returns {Promise<void>} Resolves when the connection is established.
     * @example
     * await pg.connect();
     */
    public async connect(): Promise<void> {
        if (this.isConnected && this.pool) {
            logger.info('Postgres already connected');
            return;
        }

        try {
            const { url, max, idleTimeoutMillis, connectionTimeoutMillis, ssl, sslMode, caFile } = config.postgres;

            logger.info('Attempting to connect to Postgres...', {
                sslEnabled: ssl,
                sslMode: sslMode,
            });

            let sslConfig: any = false;
            if (ssl) {
                if (sslMode === 'verify-ca' || sslMode === 'verify-full') {
                    sslConfig = {
                        rejectUnauthorized: true,
                        ca: caFile ? fs.readFileSync(caFile).toString() : undefined,
                    };
                    if (sslMode === 'verify-ca') {
                        // Skip hostname verification for verify-ca as per Coolify docs
                        sslConfig.checkServerIdentity = () => undefined;
                    }
                } else {
                    // Default to require (encrypted, but no CA verification)
                    sslConfig = { rejectUnauthorized: false };
                }
            }

            this.pool = new Pool({
                connectionString: url,
                max,
                idleTimeoutMillis,
                connectionTimeoutMillis,
                ssl: sslConfig,
            });

            // Initialize Drizzle ORM
            this.drizzle = drizzle(this.pool, { schema });

            // Test connection
            const client = await this.pool.connect();
            try {
                await client.query('SELECT 1');
                this.isConnected = true;
                logger.info('Connected to PostgreSQL successfully');
            } finally {
                client.release();
            }

            // Error handling for idle clients
            this.pool.on('error', (err, client) => {
                logger.error('Unexpected error on idle client', err);
                this.isConnected = false;
            });
        } catch (error: any) {
            logger.error('Failed to connect to PostgreSQL:', error);
            this.isConnected = false;
            throw error;
        }
    }

    /**
     * @title Get Pool
     * @description Returns the PostgreSQL pool instance.
     * @returns {Pool} The PostgreSQL pool.
     */
    public getPool(): Pool {
        if (!this.pool) {
            throw new Error('Postgres pool not initialized');
        }
        return this.pool;
    }

    /**
     * @title Get Client
     * @description Acquires a client from the pool.
     * @returns {Promise<PoolClient>} A connected client.
     */
    public async getClient(): Promise<PoolClient> {
        if (!this.pool) {
            throw new Error('Postgres pool not initialized');
        }
        return await this.pool.connect();
    }

    /**
     * @title Get Drizzle Instance
     * @description Returns the Drizzle ORM instance.
     * @returns {NodePgDatabase<typeof schema>} The Drizzle instance.
     */
    public getDrizzle(): NodePgDatabase<typeof schema> {
        if (!this.drizzle) {
            throw new Error('Drizzle ORM not initialized. Call connect() first.');
        }
        return this.drizzle;
    }

    /**
     * @title Execute Query
     * @description Executes a query using the pool.
     * @param {string} text - The query text
     * @param {any[]} [params] - The query parameters
     * @returns {Promise<QueryResult>} The query result
     */
    public async query(text: string, params?: any[]): Promise<QueryResult> {
        if (!this.pool) {
            throw new Error('Postgres pool not initialized');
        }
        return await this.pool.query(text, params);
    }

    /**
     * @title Disconnect
     * @description Gracefully shuts down the pool.
     * @returns {Promise<void>}
     */
    public async disconnect(): Promise<void> {
        if (!this.pool) {
            return;
        }

        try {
            await this.pool.end();
            this.isConnected = false;
            this.pool = null;
            logger.info('Disconnected from PostgreSQL');
        } catch (error: any) {
            logger.error('Error disconnecting from PostgreSQL:', error);
            throw error;
        }
    }

    /**
     * @title Get Connection Status
     * @description Checks if the database is currently connected.
     * @returns {boolean} True if connected, false otherwise.
     */
    public getConnectionStatus(): boolean {
        return this.isConnected;
    }

    /**
     * @title Health Check
     * @description Performs a health check on the PostgreSQL connection.
     * @returns {Promise<{ status: string; details: any }>} Health status and details.
     */
    public async healthCheck(): Promise<{ status: string; details: any }> {
        try {
            if (!this.pool) {
                return {
                    status: 'unhealthy',
                    details: 'Pool not initialized',
                };
            }
            const client = await this.pool.connect();
            try {
                await client.query('SELECT 1');
                return {
                    status: 'healthy',
                    details: {
                        connected: this.isConnected,
                        poolTotalCount: this.pool.totalCount,
                        poolIdleCount: this.pool.idleCount,
                        poolWaitingCount: this.pool.waitingCount,
                    },
                };
            } finally {
                client.release();
            }
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
}

/**
 * @title postgresConfig Singleton
 * @description Exported singleton instance of PostgresConfig.
 */
export const postgresConfig = PostgresConfig.getInstance();
