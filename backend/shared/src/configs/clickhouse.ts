import { createClient } from '@clickhouse/client';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from './logger';
import config from './app';
import { runMigrations } from '../models/clickhouse/migrations';

/**
 * @title ClickHouseConfig
 * @description Singleton class for managing ClickHouse connections.
 */
export class ClickHouseConfig {
    private static instance: ClickHouseConfig;
    private client: ReturnType<typeof createClient> | null = null;
    private isConnected = false;

    private constructor() {}

    public static getInstance(): ClickHouseConfig {
        if (!ClickHouseConfig.instance) {
            ClickHouseConfig.instance = new ClickHouseConfig();
        }
        return ClickHouseConfig.instance;
    }

    /**
     * @title Connect to ClickHouse
     * @description Initializes the ClickHouse client and tests the connection.
     */
    public async connect(): Promise<void> {
        if (this.isConnected) {
            logger.info('ClickHouse already connected');
            return;
        }

        try {
            const chConfig = await config.clickhouse;
            const parsed = new URL(chConfig.url);

            const host = `${parsed.protocol}//${parsed.hostname}${parsed.port ? `:${parsed.port}` : ''}`;
            const username = parsed.username || chConfig.username || 'default';
            const password = decodeURIComponent(parsed.password) || chConfig.password || '';
            const database =
                parsed.pathname.replace(/^\//, '') || chConfig.database || 'default';

            logger.info(
                `Attempting to connect to ClickHouse: ${host} with user: ${username}, database: ${database}`
            );

            const clientOptions: any = {
                host,
                username,
                password,
                database,
                int64_handling: 'string', // Return UInt64 as strings to prevent precision loss in JS Number
                clickhouse_settings: {
                    output_format_json_quote_64bit_integers: 1, // Force ClickHouse to wrap result integers in quotes for JSON formats
                },
            };

            if (chConfig.ssl) {
                clientOptions.tls = {
                    rejectUnauthorized: chConfig.rejectUnauthorized,
                    // IP-based certificates might not match hostnames, so we skip identity check
                    checkServerIdentity: () => undefined,
                };
                if (chConfig.caFile && fs.existsSync(chConfig.caFile)) {
                    clientOptions.tls.ca = fs.readFileSync(chConfig.caFile);
                }
            }

            this.client = createClient(clientOptions);
            logger.info('ClickHouse client created, testing connection...');

            // Test connection
            if (!(await this.client.ping())) {
                throw new Error('failed to ping clickhouse!');
            }
            logger.info('ClickHouse ping successful, running migrations...');
            await runMigrations();
            logger.info('Tables Has Been Created Successfully');
            this.isConnected = true;
            logger.info('Connected to ClickHouse successfully');
        } catch (error: any) {
            this.isConnected = false;
            logger.error('Failed to connect to ClickHouse', error);
            throw error;
        }
    }

    /**
     * @title Get ClickHouse client
     * @description Returns the connected ClickHouse client instance.
     */
    public getClient() {
        if (!this.client) throw new Error('ClickHouse client not connected');
        return this.client;
    }

    /**
     * @title Disconnect ClickHouse
     * @description Closes the ClickHouse client.
     */
    public async disconnect(): Promise<void> {
        if (!this.client) return;
        try {
            await this.client.close();
            this.client = null;
            this.isConnected = false;
        } catch (error: any) {
            logger.error('Error closing ClickHouse connection:', error);
        }
    }

    /**
     * @title Connection status
     * @description Returns true if the client is connected.
     */
    public getConnectionStatus(): boolean {
        return this.isConnected;
    }

    /**
     * @title Health Check
     * @description Simple health check by running SELECT 1.
     */
    public async healthCheck(): Promise<{ status: string; details: any }> {
        if (!this.client) {
            return { status: 'unhealthy', details: 'Client not initialized' };
        }
        try {
            if (!(await this.client.ping())) {
                throw new Error('failed to ping clickhouse!');
            }
            return {
                status: 'healthy',
                details: 'ClickHouse is up and running',
            };
        } catch (error: any) {
            return {
                status: 'unhealthy',
                details: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
}

/**
 * @title clickhouseConfig Singleton
 */
export const clickhouseConfig = ClickHouseConfig.getInstance();
