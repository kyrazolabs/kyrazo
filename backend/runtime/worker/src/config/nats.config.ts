import { connect, StringCodec } from 'nats';
import type { NatsConnection, JetStreamManager, JetStreamClient } from 'nats';
import * as dotenv from 'dotenv';

import { logger } from '@kyrazo/shared';
import config from './app.config';

dotenv.config();

/**
 * @title NatsConfig
 * @description Singleton class for managing NATS connections, JetStream operations, and health checks.
 *
 * @example
 * const nats = NatsConfig.getInstance();
 * await nats.connect();
 * const jsm = nats.getJetStreamManager();
 * const status = await nats.healthCheck();
 */
export class NatsConfig {
    public static instance: NatsConfig;
    public nc: NatsConnection | null = null;
    public jsm: JetStreamManager | null = null;
    public js: JetStreamClient | null = null;
    public isConnected = false;

    /**
     * @title NatsConfig Constructor
     * @description Private constructor to enforce singleton pattern.
     */
    private constructor() {}

    /**
     * @title Get NatsConfig Instance
     * @description Returns the singleton instance of NatsConfig.
     * @returns {NatsConfig} The singleton instance.
     * @example
     * const nats = NatsConfig.getInstance();
     */
    public static getInstance(): NatsConfig {
        if (!NatsConfig.instance) {
            NatsConfig.instance = new NatsConfig();
        }
        return NatsConfig.instance;
    }

    /**
     * @title Connect to NATS
     * @description Establishes a connection to the NATS server with JetStream support.
     * @returns {Promise<void>} Resolves when the connection is established.
     * @example
     * await nats.connect();
     */
    public async connect(): Promise<void> {
        if (this.isConnected && this.nc) {
            logger.info('NATS already connected');
            return;
        }

        try {
            // Connect to NATS
            this.nc = await connect({
                servers: config.nats.servers,
                tls: config.nats.tls.enabled
                    ? {
                          certFile: config.nats.tls.certFile,
                          keyFile: config.nats.tls.keyFile,
                          caFile: config.nats.tls.caFile,
                      }
                    : undefined,
                user: config.nats.user,
                pass: config.nats.password,
                maxReconnectAttempts: config.nats.maxReconnectAttempts,
                reconnectTimeWait: config.nats.reconnectTimeWait,
                timeout: config.nats.timeout,
            });

            // Initialize JetStream Manager
            this.jsm = await this.nc.jetstreamManager();

            // Initialize JetStream Client
            this.js = this.nc.jetstream();

            // Send PING
            this.nc.publish('webhooks.init', 'PING');

            this.isConnected = true;
            logger.info('Connected to NATS successfully');

            // Test JetStream with a ping
            try {
                await this.nc.request('$JS.API.INFO', '', { timeout: 5000 });
                logger.info('NATS JetStream PING successful');
            } catch (error: any) {
                logger.warn('NATS JetStream PING failed:', error);
            }

            // Handle connection events
            this.nc
                .closed()
                .then(() => {
                    logger.warn('NATS connection closed');
                    this.isConnected = false;
                })
                .catch((error: any) => {
                    logger.error('NATS connection error:', error);
                    this.isConnected = false;
                });
        } catch (error: any) {
            logger.error('Failed to connect to NATS:', error);
            this.isConnected = false;
            throw error;
        }
    }

    /**
     * @title Disconnect from NATS
     * @description Gracefully disconnects from the NATS server.
     * @returns {Promise<void>} Resolves when the connection is closed.
     * @example
     * await nats.disconnect();
     */
    public async disconnect(): Promise<void> {
        if (!this.isConnected || !this.nc) {
            return;
        }

        try {
            await this.nc.close();
            this.nc = null;
            this.jsm = null;
            this.js = null;
            this.isConnected = false;
            logger.info('Disconnected from NATS');
        } catch (error: any) {
            logger.error('Error disconnecting from NATS:', error);
            throw error;
        }
    }

    /**
     * @title Get NATS Connection
     * @description Returns the NATS connection instance. Throws if not connected.
     * @returns {NatsConnection} The NATS connection.
     * @throws {Error} If the connection is not established.
     * @example
     * const nc = nats.getConnection();
     */
    public getConnection(): NatsConnection {
        if (!this.nc || !this.isConnected) {
            throw new Error('NATS connection is not established');
        }
        return this.nc;
    }

    /**
     * @title Get JetStream Manager
     * @description Returns the JetStream manager instance. Throws if not connected.
     * @returns {JetStreamManager} The JetStream manager.
     * @throws {Error} If the connection is not established.
     * @example
     * const jsm = nats.getJetStreamManager();
     */
    public getJetStreamManager(): JetStreamManager {
        if (!this.jsm || !this.isConnected) {
            throw new Error('NATS JetStream manager is not available');
        }
        return this.jsm;
    }

    /**
     * @title Get JetStream Client
     * @description Returns the JetStream client instance. Throws if not connected.
     * @returns {JetStreamClient} The JetStream client.
     * @throws {Error} If the connection is not established.
     * @example
     * const js = nats.getJetStreamClient();
     */
    public getJetStreamClient(): JetStreamClient {
        if (!this.js || !this.isConnected) {
            throw new Error('NATS JetStream client is not available');
        }
        return this.js;
    }

    /**
     * @title Get Connection Status
     * @description Checks if the NATS connection is established and active.
     * @returns {boolean} True if connected, false otherwise.
     * @example
     * const isConnected = nats.getConnectionStatus();
     */
    public getConnectionStatus(): boolean {
        return this.isConnected && !!this.nc && !this.nc.isClosed();
    }

    /**
     * @title Health Check
     * @description Performs a health check on the NATS connection, returning status and details.
     * @returns {Promise<{ status: string; details: any }>} Health status and details.
     * @example
     * const health = await nats.healthCheck();
     */
    public async healthCheck(): Promise<{
        status: string;
        details: Record<string, unknown>;
    }> {
        try {
            if (!this.nc || !this.isConnected) {
                return {
                    status: 'unhealthy',
                    details: {
                        connected: false,
                        error: 'Connection not established',
                    },
                };
            }

            // Simple ping to check connection
            await this.nc.flush();

            return {
                status: 'healthy',
                details: {
                    connected: this.isConnected,
                    server: this.nc.getServer(),
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
}

/**
 * @title natsConfig Singleton
 * @description Exported singleton instance of NatsConfig for use throughout the application.
 * @example
 * import { natsConfig } from './nats';
 * await natsConfig.connect();
 */
export const natsConfig = NatsConfig.getInstance();
