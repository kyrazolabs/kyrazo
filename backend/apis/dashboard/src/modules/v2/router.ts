import { Hono } from 'hono';
import transformsV2Router from './transforms/transforms.routes';
import { clickhouseConfig, databaseConfig } from '@kyrazo/shared';
import { redisConfig } from '@/configs';

const router = new Hono();

// Mount transforms routes
router.route('/transforms', transformsV2Router);

// Health check endpoint
router.get('/health', async c => {
    try {
        // Check all database services in parallel
        const [mongo, clickhouse, redis, redisQueue] = await Promise.all([
            databaseConfig.healthCheck(),
            clickhouseConfig.healthCheck(),
            redisConfig.healthCheck(),
            (async () => {
                try {
                    const queueClient = redisConfig.getQueueClient();
                    const ping = await queueClient.ping();
                    return {
                        status: 'healthy',
                        details: {
                            connected: true,
                            ping,
                        },
                    };
                } catch (error: any) {
                    return {
                        status: 'unhealthy',
                        details: {
                            connected: false,
                            error: error instanceof Error ? error.message : 'Unknown error',
                        },
                    };
                }
            })(),
        ]);

        // Determine overall health status
        const allHealthy = [mongo, clickhouse, redis, redisQueue].every(
            service => service.status === 'healthy'
        );

        return c.json({
            success: allHealthy,
            message: allHealthy ? 'All services are healthy' : 'Some services are unhealthy',
            services: {
                mongo,
                clickhouse,
                redis,
                redisQueue,
            },
            timestamp: new Date().toISOString(),
            version: '1.0.0',
        });
    } catch (error: any) {
        return c.json(
            {
                success: false,
                message: 'Health check failed',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
            },
            500
        );
    }
});

export type AppType = typeof router;
export default router;
