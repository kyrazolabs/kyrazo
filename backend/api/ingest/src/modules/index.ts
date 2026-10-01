import { Hono, type Context } from 'hono';
import ingestRouter from './v1/ingest/ingest.routes';
import { databaseConfig } from '@kyrazo/shared';
import { redisConfig, natsConfig } from '@/configs';

const router = new Hono();

// Mount ingest routes
router.route('/', ingestRouter);

// Health check endpoint
router.get('/health', async (c: Context) => {
    try {
        // Check all services in parallel
        const [mongo, redis, redisQueue, nats] = await Promise.all([
            databaseConfig.healthCheck(),
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
            natsConfig.healthCheck(),
        ]);

        // Determine overall health status
        const allHealthy = [mongo, redis, redisQueue, nats].every(
            service => service.status === 'healthy'
        );

        return c.json(
            {
                success: allHealthy,
                message: allHealthy ? 'All services are healthy' : 'Some services are unhealthy',
                services: {
                    mongo,
                    redis,
                    redisQueue,
                    nats,
                },
                timestamp: new Date().toISOString(),
                version: '1.0.0',
            },
            allHealthy ? 200 : 503
        );
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
