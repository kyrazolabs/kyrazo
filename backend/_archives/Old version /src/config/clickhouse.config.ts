import { createClient } from '@clickhouse/client';
import { logger } from '@/utils';
import config from './app.config';
import { runMigrations } from '@/database/models/clickhouse/migrations';

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
      const { url, username, password, database } = config.clickhouse;
      if (!url || !username || !password) {
        throw new Error('ClickHouse configuration is incomplete');
      }

      this.client = createClient({ url, username, password, database});

      // Test connection
      if (!(await this.client.ping())) {
        throw new Error('failed to ping clickhouse!');
      }
      await runMigrations();
      logger.info("Tables Has Been Created Successfully")
      this.isConnected = true;
      logger.info('Connected to ClickHouse successfully');
    } catch (error) {
      this.isConnected = false;
      logger.error('Failed to connect to ClickHouse:', error);
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
      return { status: 'healthy', details: 'ClickHouse is up and running' };
    } catch (error) {
      return { status: 'unhealthy', details: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

/**
 * @title clickhouseConfig Singleton
 */
export const clickhouseConfig = ClickHouseConfig.getInstance();
