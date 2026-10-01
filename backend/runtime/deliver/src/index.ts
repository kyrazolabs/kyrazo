#!/usr/bin/env bun

import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { bootstrap } from './app/worker.bootstrap';
import { logger as appLogger, databaseConfig } from '@kyrazo/shared';
import { redisConfig } from '@/config';

/**
 * @title Worker Service
 * @description Standalone consumer service for processing webhook events.
 * Runs independently from the API server but exposes a healthcheck endpoint.
 *
 * @example
 * bun run src/index.ts
 */

const app = new Hono();

app.use('*', logger());

app.get('/v1/health', async c => {
    try {
        // Check all services in parallel utilizing their native health checks where applicable
        const [mongo, redis] = await Promise.all([
            databaseConfig.healthCheck(),
            redisConfig.healthCheck(),
        ]);

        const allHealthy = [mongo, redis].every(s => s.status === 'healthy');

        return c.json({
            success: allHealthy,
            message: allHealthy ? 'All services are healthy' : 'Some services are unhealthy',
            services: { mongo, redis },
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        return c.json(
            {
                success: false,
                message: 'Health check failed',
                error: error.message || 'Unknown error',
                timestamp: new Date().toISOString(),
            },
            500
        );
    }
});

async function main() {
    appLogger.info('🚀 Starting NATS JetStream Worker Service...');

    try {
        const success = await bootstrap();
        if (!success) {
            appLogger.error('Worker failed to start during bootstrap. Exiting.');
            process.exit(1);
        }
        appLogger.info('Worker started successfully');

        const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
        Bun.serve({
            port,
            hostname: '0.0.0.0',
            reusePort: true,
            fetch: app.fetch,
        });

        appLogger.info(
            `🚀 Worker HTTP Healthcheck server running on port ${port} (reusePort active)`
        );
    } catch (error: any) {
        console.error('❌ Failed to start worker service:', error);
        process.exit(1);
    }
}

// Start the worker service
main().catch(error => {
    appLogger.error('Failed to start worker:', error);
    process.exit(1);
});
