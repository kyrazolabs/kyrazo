import { Hono } from 'hono';
import eventsRouter from './v1/events/event.routes';
import targetsRouter from './v1/targets/target.routes';
import endpointsRouter from './v1/endpoints/endpoint.routes';
import sourceRouter from './v1/source/source.routes';
import type { AppContext } from '@/core/middlewares/auth.middleware';
import { databaseConfig } from '@kyrazo/shared';
import { redisConfig, natsConfig } from '@/configs';

const router = new Hono();

// Mount routes
router.route('/events', eventsRouter);
router.route('/targets', targetsRouter);
router.route('/endpoints', endpointsRouter);
router.route('/source', sourceRouter);

// Health check endpoint
router.get('/health', async (c: AppContext) => {
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
                } catch (error) {
                    return {
                        status: 'unhealthy',
                        details: {
                            connected: false,
                            error:
                                error instanceof Error
                                    ? error.message
                                    : 'Unknown error',
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

        return c.json({
            success: allHealthy,
            message: allHealthy
                ? 'All services are healthy'
                : 'Some services are unhealthy',
            services: {
                mongo,
                redis,
                redisQueue,
                nats,
            },
            timestamp: new Date().toISOString(),
            version: '1.0.0',
        });
    } catch (error) {
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
