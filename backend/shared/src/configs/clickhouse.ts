import { createClient, ClickHouseClient } from '@clickhouse/client';
import * as fs from 'fs';
import { logger } from './logger';
import config from './app';
import { runMigrations } from '../models/clickhouse/migrations';

/**
 * @title ClickHouseConfig
 * @description Singleton class for managing ClickHouse connections using @clickhouse/client.
 * TLS is handled by providing the CA cert directly to the client, and NODE_EXTRA_CA_CERTS
 * ensures Bun's underlying TLS stack trusts the custom CA system-wide.
 */
export class ClickHouseConfig {
    private static instance: ClickHouseConfig;
    private client: ClickHouseClient | null = null;
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
     * @description Initializes the ClickHouse client with TLS and tests the connection.
     */
    public async connect(): Promise<void> {
        if (this.isConnected) {
            logger.info('ClickHouse already connected');
            return;
        }

        try {
            const chConfig = config.clickhouse;
            const parsed = new URL(chConfig.url);

            const portPart = parsed.port
                ? `:${parsed.port}`
                : parsed.protocol === 'https:'
                  ? ':8443'
                  : ':8123';

            const sanitizedUrl = `${parsed.protocol}//${parsed.hostname}${portPart}`;
            const username = parsed.username || chConfig.username || 'default';
            const password = decodeURIComponent(parsed.password || chConfig.password || '');
            const database = parsed.pathname.replace(/^\//, '') || chConfig.database || 'default';

            logger.info(
                `Attempting to connect to ClickHouse: ${sanitizedUrl} (Database: ${database}, User: ${username})`
            );

            // Build TLS configuration from the CA cert file
            let tls: { ca_cert: Buffer } | undefined;
            if (chConfig.caFile && fs.existsSync(chConfig.caFile)) {
                logger.info(`ClickHouse: loading CA cert from ${chConfig.caFile}`);
                tls = { ca_cert: fs.readFileSync(chConfig.caFile) };
            } else if (chConfig.ssl) {
                logger.warn(
                    `ClickHouse: HTTPS enabled but CA file not found at "${chConfig.caFile}". ` +
                        `Relying on NODE_EXTRA_CA_CERTS or system trust store.`
                );
            }

            this.client = createClient({
                url: sanitizedUrl,
                username,
                password,
                database,
                tls: tls,
                request_timeout: 30_000,
                keep_alive: { enabled: true },
            });

            logger.info('ClickHouse client created, testing connection...');

            // Test connection
            if (!(await this.client.ping())) {
                throw new Error('ClickHouse ping failed');
            }

            logger.info('ClickHouse ping successful, running migrations...');
            await runMigrations();
            logger.info('ClickHouse migrations completed successfully');
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
     */
    public getClient(): ClickHouseClient {
        if (!this.client) {
            throw new Error('ClickHouse client not initialized. Call connect() first.');
        }
        return this.client;
    }

    /**
     * @title Disconnect ClickHouse
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

    public getConnectionStatus(): boolean {
        return this.isConnected;
    }

    /**
     * @title Health Check
     */
    public async healthCheck(): Promise<{ status: string; details: any }> {
        if (!this.client) {
            return { status: 'unhealthy', details: 'Client not initialized' };
        }
        try {
            if (!(await this.client.ping())) {
                throw new Error('ClickHouse ping failed');
            }
            return { status: 'healthy', details: 'ClickHouse is up and running' };
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
