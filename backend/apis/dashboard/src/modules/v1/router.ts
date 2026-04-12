import { Hono } from 'hono';
import authRouter from './auth/auth.routes';
import profileRouter from './profile/profile.routes';
import workspaceRouter from './workspace/workspace.routes';
import keyRouter from './key/key.routes';
import endpointRouter from './endpoints/endpoint.routes';
import sourcesRouter from './source/source.routes';
import deliveryRouter from './delivery/delivery.routes';
import analyticsRouter from './analytics/analytics.routes';
import namespaceRouter from './namespace/namespace.routes';
import targetRouter from './target/target.routes';
import ingestRouter from './ingest/ingest.routes';
import supportRouter from './support/support.routes';
import workerRouter from './worker/worker.routes';

import { clickhouseConfig, databaseConfig } from '@kyrazo/shared';
import { redisConfig } from '@/configs';
import billingRouter from './billing';

const router = new Hono();

// Mount auth routes
router.route('/auth', authRouter);

// Mount profile routes
router.route('/profile', profileRouter);

// Mount workspace routes
router.route('/workspaces', workspaceRouter);

// Mount namespace routes
router.route('/namespaces', namespaceRouter);

// Mount api key routes
router.route('/keys', keyRouter);

// Mount endpoints routes
router.route('/endpoints', endpointRouter);

// Mount sources routes
router.route('/sources', sourcesRouter);

// Mount targets routes
router.route('/targets', targetRouter);

// Mount deliveries routes
router.route('/deliveries', deliveryRouter);

// Mount analytics routes
router.route('/analytics', analyticsRouter);

// Mount ingest routes
router.route('/ingest', ingestRouter);

// Mount support routes
router.route('/support', supportRouter);

// Mount worker routes
router.route('/workers', workerRouter);

// Mount billing routes
router.route('/payments', billingRouter.payments);
router.route('/subscriptions', billingRouter.subscriptions);
router.route('/plans', billingRouter.plans);

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
