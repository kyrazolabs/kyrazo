import mongoose from 'mongoose';
import * as fs from 'fs';
import { logger } from './logger';
import config from './app';

/**
 * @title DatabaseConfig
 * @description Singleton class for managing MongoDB database connections and health checks.
 *
 * @example
 * const db = DatabaseConfig.getInstance();
 * await db.connect();
 * const status = await db.healthCheck();
 */
export class DatabaseConfig {
    private static instance: DatabaseConfig;
    private isConnected = false;

    /**
     * @title DatabaseConfig Constructor
     * @description Private constructor to enforce singleton pattern.
     */
    private constructor() {}

    /**
     * @title Get DatabaseConfig Instance
     * @description Returns the singleton instance of DatabaseConfig.
     * @returns {DatabaseConfig} The singleton instance.
     * @example
     * const db = DatabaseConfig.getInstance();
     */
    public static getInstance(): DatabaseConfig {
        if (!DatabaseConfig.instance) {
            DatabaseConfig.instance = new DatabaseConfig();
        }
        return DatabaseConfig.instance;
    }

    /**
     * @title Connect to MongoDB
     * @description Establishes a connection to the MongoDB database using environment variables.
     * @returns {Promise<void>} Resolves when the connection is established.
     * @example
     * await db.connect();
     */
    public async connect(): Promise<void> {
        if (this.isConnected) {
            logger.info('Database already connected');
            return;
        }

        try {
            const mongoUri = config.database.uri;
            if (!mongoUri) {
                throw new Error('MONGODB_URI environment variable is not defined');
            }

            logger.info('Connecting to MongoDB...', {
                uri: mongoUri.replace(/:([^@]+)@/, ':****@'), // Mask password
                dbName: config.database.dbName,
            });

            await mongoose.connect(mongoUri, {
                dbName: config.database.dbName!,
                maxPoolSize: config.database.maxPoolSize,
                minPoolSize: config.database.minPoolSize,
                serverSelectionTimeoutMS: config.database.serverSelectionTimeoutMS,
                socketTimeoutMS: config.database.socketTimeoutMS,
                connectTimeoutMS: config.database.connectTimeoutMS,
                heartbeatFrequencyMS: config.database.heartbeatFrequencyMS,
                retryWrites: config.database.retryWrites,
                retryReads: config.database.retryReads,
                bufferCommands: false,
                ssl: (config.database as any).ssl,
                ca: (config.database as any).caFile ? fs.readFileSync((config.database as any).caFile) : undefined,
                // bufferMaxEntries: 0,
            } as any);

            this.isConnected = true;
            logger.info('Mongoose connected to MongoDB successfully');

            // Handle connection events
            mongoose.connection.on('error', error => {
                logger.error('MongoDB connection error:', error);
                this.isConnected = false;
            });

            mongoose.connection.on('disconnected', () => {
                logger.warn('MongoDB disconnected');
                this.isConnected = false;
            });

            mongoose.connection.on('reconnected', () => {
                logger.info('MongoDB reconnected');
                this.isConnected = true;
            });
        } catch (error: any) {
            let errorMessage = 'Failed to connect to MongoDB';
            if (
                (error as any).message?.includes('ESERVFAIL') ||
                (error as any).message?.includes('EAI_AGAIN')
            ) {
                errorMessage +=
                    ' (Tip: If using a replica set in a restricted network, try adding ?directConnection=true to your MONGODB_URI)';
            }
            logger.error(errorMessage, error);
            this.isConnected = false;
            throw error;
        }
    }

    /**
     * @title Disconnect from MongoDB
     * @description Gracefully disconnects from the MongoDB database.
     * @returns {Promise<void>} Resolves when the connection is closed.
     * @example
     * await db.disconnect();
     */
    public async disconnect(): Promise<void> {
        if (!this.isConnected) {
            return;
        }

        try {
            await mongoose.disconnect();
            this.isConnected = false;
            logger.info('Disconnected from MongoDB');
        } catch (error: any) {
            logger.error('Error disconnecting from MongoDB:', error);
            throw error;
        }
    }

    /**
     * @title Get Connection Status
     * @description Checks if the database is currently connected.
     * @returns {boolean} True if connected, false otherwise.
     * @example
     * const isConnected = db.getConnectionStatus();
     */
    public getConnectionStatus(): boolean {
        return this.isConnected && mongoose.connection.readyState === 1;
    }

    /**
     * @title Health Check
     * @description Performs a health check on the MongoDB connection, returning status and details.
     * @returns {Promise<{ status: string; details: any }>} Health status and details.
     * @example
     * const health = await db.healthCheck();
     */
    public async healthCheck(): Promise<{ status: string; details: any }> {
        try {
            const adminDb = mongoose.connection.db?.admin();
            const result = await adminDb?.ping();

            return {
                status: 'healthy',
                details: {
                    connected: this.isConnected,
                    readyState: mongoose.connection.readyState,
                    host: mongoose.connection.host,
                    port: mongoose.connection.port,
                    name: mongoose.connection.name,
                    ping: result,
                },
            };
        } catch (error: any) {
            return {
                status: 'unhealthy',
                details: {
                    connected: this.isConnected,
                    readyState: mongoose.connection.readyState,
                    error: error instanceof Error ? error.message : 'Unknown error',
                },
            };
        }
    }
}

/**
 * @title databaseConfig Singleton
 * @description Exported singleton instance of DatabaseConfig for use throughout the application.
 * @example
 * import { databaseConfig } from './database';
 * await databaseConfig.connect();
 */
export const databaseConfig = DatabaseConfig.getInstance();
const Types = mongoose.Types;
export { mongoose, Types };
