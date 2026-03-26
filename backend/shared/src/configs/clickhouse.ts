import * as fs from 'fs';
import * as path from 'path';
import { logger } from './logger';
import config from './app';
import { runMigrations } from '../models/clickhouse/migrations';

/**
 * Interface matching the result shape returned by query() so repositories can call .json<T>()
 */
interface ClickHouseQueryResult {
    json<T>(): Promise<T[]>;
}

/**
 * @title Manual ClickHouse Client
 * @description A minimal fetch-based client that mirrors verified 'curl' logic from clickhouse-test.ts.
 * Bypasses official library to use raw GET requests with queries in the URL.
 */
class ManualClickHouseClient {
    private url: string;
    private auth: string;
    private tlsConfig: any;

    constructor(options: {
        url: string;
        username?: string;
        password?: string;
        caFile?: string;
        rejectUnauthorized?: boolean;
    }) {
        this.url = options.url;
        const user = options.username || 'default';
        const pass = options.password || '';
        this.auth = Buffer.from(`${user}:${pass}`).toString('base64');

        if (options.url.startsWith('https')) {
            this.tlsConfig = {
                rejectUnauthorized: options.rejectUnauthorized ?? false,
            };
            if (options.caFile && fs.existsSync(options.caFile)) {
                this.tlsConfig.ca = fs.readFileSync(options.caFile);
            }
        }
    }

    private getHeaders() {
        return {
            Authorization: `Basic ${this.auth}`,
            Accept: 'application/json',
        };
    }

    async ping(): Promise<boolean> {
        try {
            const res = await fetch(`${this.url}/ping`, {
                headers: this.getHeaders(),
                // @ts-ignore - Bun/Node-compatible fetch supports tls
                tls: this.tlsConfig,
            });
            return res.status === 200;
        } catch (error) {
            logger.error('ClickHouse Manual Ping failed', error);
            return false;
        }
    }

    private buildUrl(query: string, params?: Record<string, any>, settings?: Record<string, any>) {
        const queryUrl = new URL(this.url);
        queryUrl.searchParams.set('query', query);

        if (params) {
            Object.entries(params).forEach(([k, v]) => {
                queryUrl.searchParams.set(`param_${k}`, String(v));
            });
        }

        if (settings) {
            Object.entries(settings).forEach(([k, v]) => {
                queryUrl.searchParams.set(k, String(v));
            });
        }

        return queryUrl.toString();
    }

    async exec(params: {
        query: string;
        query_params?: Record<string, any>;
        clickhouse_settings?: any;
    }): Promise<any> {
        const url = this.buildUrl(params.query, params.query_params, params.clickhouse_settings);

        const res = await fetch(url, {
            method: 'GET',
            headers: this.getHeaders(),
            // @ts-ignore - Bun/Node-compatible fetch supports tls
            tls: this.tlsConfig,
        });

        if (!res.ok) {
            const errorText = await res.text();
            logger.error('ClickHouse Manual Exec failed', {
                status: res.status,
                error: errorText,
                query: params.query.substring(0, 100),
            });
            throw new Error(`ClickHouse error: ${errorText}`);
        }

        return res;
    }

    async query(params: {
        query: string;
        query_params?: Record<string, any>;
        format?: string;
        clickhouse_settings?: any;
    }): Promise<ClickHouseQueryResult> {
        // Force output format if specified
        let fullQuery = params.query;
        if (params.format && !fullQuery.toUpperCase().includes('FORMAT')) {
            fullQuery += ` FORMAT ${params.format}`;
        }

        const capturedFormat = params.format;
        const res = await this.exec({
            query: fullQuery,
            query_params: params.query_params,
            clickhouse_settings: params.clickhouse_settings,
        });

        return {
            json: async <T>(): Promise<T[]> => {
                const text = await res.text();
                if (!text.trim()) return [];
                // Handle JSONEachRow (newline delimited) or standard JSON
                if (capturedFormat === 'JSONEachRow') {
                    return text
                        .split('\n')
                        .filter((l: string) => l.trim())
                        .map((l: string) => JSON.parse(l)) as T[];
                }
                try {
                    const parsed = JSON.parse(text);
                    return (parsed.data || parsed) as T[];
                } catch {
                    return text as any;
                }
            },
        };
    }

    async insert(params: { table: string; values: any[]; format?: string }): Promise<void> {
        const format = params.format || 'JSONEachRow';
        const query = `INSERT INTO ${params.table} FORMAT ${format}`;
        const url = this.buildUrl(query);

        // For JSONEachRow, ClickHouse expects newline-delimited JSON
        const body = params.values.map(v => JSON.stringify(v)).join('\n') + '\n';

        const res = await fetch(url, {
            method: 'POST',
            headers: this.getHeaders(),
            body,
            // @ts-ignore - Bun/Node-compatible fetch supports tls
            tls: this.tlsConfig,
        });

        if (!res.ok) {
            const errorText = await res.text();
            logger.error('ClickHouse Manual Insert failed', {
                status: res.status,
                table: params.table,
                error: errorText,
            });
            throw new Error(`ClickHouse Insert error: ${errorText}`);
        }
    }

    // Required for compatibility
    async close() {
        return Promise.resolve();
    }
}

/**
 * @title ClickHouseConfig
 * @description Singleton class for managing ClickHouse connections.
 */
export class ClickHouseConfig {
    private static instance: ClickHouseConfig;
    private client: ManualClickHouseClient | null = null;
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
     * @description Initializes the manual ClickHouse client and tests the connection.
     */
    public async connect(): Promise<void> {
        if (this.isConnected) {
            logger.info('ClickHouse already connected');
            return;
        }

        try {
            const chConfig = config.clickhouse;
            const parsed = new URL(chConfig.url);

            // Align with test script behavior: use port from URL if present, else ClickHouse defaults
            const portPart = parsed.port
                ? `:${parsed.port}`
                : parsed.protocol === 'https:'
                  ? ':8443'
                  : ':8123';

            // Construct sanitized URL for the client and logging
            const sanitizedUrl = `${parsed.protocol}//${parsed.hostname}${portPart}`;
            const username = parsed.username || chConfig.username || 'default';
            const password = decodeURIComponent(parsed.password || chConfig.password || '');
            const database = parsed.pathname.replace(/^\//, '') || chConfig.database || 'default';

            logger.info(
                `Attempting to connect to ClickHouse (Manual Fetch): ${sanitizedUrl} (Database: ${database}, User: ${username})`
            );

            this.client = new ManualClickHouseClient({
                url: sanitizedUrl,
                username,
                password,
                caFile: chConfig.caFile,
                rejectUnauthorized: true, // matches test script's flexible approach
            });

            logger.info('ClickHouse client created, testing connection...');

            // Test connection
            if (!(await this.client.ping())) {
                throw new Error('failed to ping clickhouse (Manual Fetch)!');
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
