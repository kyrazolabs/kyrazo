import { Hono } from 'hono';
import authRouter from './v1/auth/auth.routes';
import workspaceRouter from './v1/workspace/workspace.routes';
import keyRouter from './v1/key/key.routes';
import endpointRouter from './v1/endpoints/endpoint.routes';
import sourcesRouter from './v1/source/source.routes';
import deliveryRouter from './v1/delivery/delivery.routes';
import analyticsRouter from './v1/analytics/analytics.routes';
import billingRouter from './billing';
import namespaceRouter from './v1/namespace/namespace.routes';
import targetRouter from './v1/target/target.routes';
import ingestRouter from './v1/ingest/ingest.routes';
import supportRouter from './v1/support/support.routes';
import workerRouter from './v1/worker/worker.routes';
import { clickhouseConfig, databaseConfig, postgresConfig } from '@kyrazo/shared';
import { redisConfig } from '@/configs';

const router = new Hono();

// Mount auth routes
router.route('/auth', authRouter);

router.route('/workspaces', workspaceRouter);

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
        const [mongo, postgres, clickhouse, redis, redisQueue] = await Promise.all([
            databaseConfig.healthCheck(),
            postgresConfig.healthCheck(),
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
        const allHealthy = [mongo, postgres, clickhouse, redis, redisQueue].every(
            service => service.status === 'healthy'
        );

        return c.json({
            success: allHealthy,
            message: allHealthy ? 'All services are healthy' : 'Some services are unhealthy',
            services: {
                mongo,
                postgres,
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
