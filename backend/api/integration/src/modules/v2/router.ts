import { Hono } from 'hono';
import type { AppContext } from '@/core/middlewares/auth.middleware';
import { databaseConfig } from '@kyrazo/shared';
import { redisConfig, natsConfig } from '@/configs';

import transformV2Router from './transform/transform.routes';
import sourceV2Router from './source/source.routes';
import endpointV2Router from './endpoint/endpoint.routes';
import s3V2Router from './s3/s3.routes';
import asqsV2Router from './asqs/asqs.routes';
import namespaceV2Router from './namespace/namespace.routes';

const router = new Hono();

// Mount V2 routes
router.route('/transformers', transformV2Router);
router.route('/sources', sourceV2Router);
router.route('/endpoints', endpointV2Router);
router.route('/s3', s3V2Router);
router.route('/asqs', asqsV2Router);
router.route('/namespaces', namespaceV2Router);

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

        return c.json({
            success: allHealthy,
            message: allHealthy ? 'All services are healthy' : 'Some services are unhealthy',
            services: {
                mongo,
                redis,
                redisQueue,
                nats,
            },
            timestamp: new Date().toISOString(),
            version: '2',
        });
    } catch (error: any) {
        return c.json(
            {
                success: false,
                message: 'Health check failed',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
                version: '2',
            },
            500
        );
    }
});

export type AppType = typeof router;
export default router;
