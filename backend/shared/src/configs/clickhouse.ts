import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
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
 * @description Uses curl + execSync exactly like clickhouse-test.ts.
 * This is the only approach verified to work with the production CA cert across servers.
 */
class ManualClickHouseClient {
    private baseUrl: string;
    private auth: string;
    private caFile: string | undefined;

    constructor(options: {
        url: string;
        username?: string;
        password?: string;
        caFile?: string;
    }) {
        this.baseUrl = options.url;
        const user = options.username || 'default';
        const pass = options.password || '';
        this.auth = `${user}:${pass}`;
        this.caFile = options.caFile;
    }

    private buildEndpoint(query: string, params?: Record<string, any>): string {
        const parsed = new URL(this.baseUrl);
        const endpoint = new URL(`${parsed.protocol}//${parsed.hostname}:${parsed.port}/`);
        endpoint.searchParams.set('query', query);
        if (params) {
            Object.entries(params).forEach(([k, v]) => {
                endpoint.searchParams.set(`param_${k}`, String(v));
            });
        }
        return endpoint.toString();
    }

    private runCurl(endpoint: string, body?: string): string {
        const parts: string[] = ['curl', '--silent', '--fail'];

        if (this.caFile && fs.existsSync(this.caFile)) {
            parts.push(`--cacert "${this.caFile}"`);
        } else {
            // No CA — skip TLS verification (development/unknown cert)
            parts.push('--insecure');
        }

        parts.push(`--user "${this.auth}"`);

        if (body !== undefined) {
            parts.push('--request POST');
            parts.push(`--data-binary @-`);
        }

        parts.push(`"${endpoint}"`);

        const cmd = parts.join(' ');
        logger.debug(`ClickHouse curl: ${cmd.substring(0, 120)}...`);

        return execSync(cmd, {
            encoding: 'utf8',
            input: body,
            timeout: 30_000,
        }).trim();
    }

    async ping(): Promise<boolean> {
        try {
            const result = this.runCurl(this.buildEndpoint('SELECT 1'));
            return result.trim() === '1';
        } catch (error: any) {
            const msg = error?.stderr?.toString?.().trim() || error?.message || String(error);
            logger.error('ClickHouse Ping failed', { error: msg });
            return false;
        }
    }

    async exec(params: {
        query: string;
        query_params?: Record<string, any>;
        clickhouse_settings?: any;
    }): Promise<string> {
        const endpoint = this.buildEndpoint(params.query, params.query_params);
        return this.runCurl(endpoint);
    }

    async query(params: {
        query: string;
        query_params?: Record<string, any>;
        format?: string;
        clickhouse_settings?: any;
    }): Promise<ClickHouseQueryResult> {
        const format = params.format || 'JSONEachRow';
        let fullQuery = params.query.trim();
        if (!fullQuery.toUpperCase().includes('FORMAT')) {
            fullQuery += ` FORMAT ${format}`;
        }

        const endpoint = this.buildEndpoint(fullQuery, params.query_params);
        const capturedFormat = format;

        return {
            json: async <T>(): Promise<T[]> => {
                const text = this.runCurl(endpoint);
                if (!text.trim()) return [];
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
                    return [] as T[];
                }
            },
        };
    }

    async insert(params: { table: string; values: any[]; format?: string }): Promise<void> {
        const format = params.format || 'JSONEachRow';
        const query = `INSERT INTO ${params.table} FORMAT ${format}`;
        const body = params.values.map(v => JSON.stringify(v)).join('\n') + '\n';

        const endpoint = this.buildEndpoint(query);
        this.runCurl(endpoint, body);
    }

    async close(): Promise<void> {
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
