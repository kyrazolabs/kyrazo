import { Hono } from 'hono';
import cron from 'node-cron';
import { logger } from 'hono/logger';
import { zValidator } from '@hono/zod-validator';
import { ServerController } from '@/modules/servers/server.controller';
import { WorkerService } from '@/modules/workers/worker.service';
import { serverAuth } from '@/auth/server.auth';
import { monitorDeadServers } from '@/jobs/monitor';
import { config } from '@/common/config'; // Validation runs on import
import { globalErrorHandler } from '@/common/error';
import {
    RegisterServerSchema,
    AckCommandSchema,
    StartWorkerSchema,
    StopWorkerSchema,
} from '@/modules/servers/server.dto';
import { subscriptionsJob } from './jobs/subscriptions.job';
import { databaseConfig } from '@kyrazo/shared';
import { Gateway } from '@/modules/gateway/gateway';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

const app = new Hono();

app.use('*', logger());
app.onError(globalErrorHandler);

// --- Public Routes ---
app.get('/v1/health', async c => {
    try {
        // Check all services in parallel
        const [mongo, postgres] = await Promise.all([
            databaseConfig.healthCheck(),
            (async () => {
                try {
                    await db.execute(sql`SELECT 1`);
                    return {
                        status: 'healthy',
                        details: {
                            connected: true,
                            database: 'PostgreSQL',
                        },
                    };
                } catch (error) {
                    return {
                        status: 'unhealthy',
                        details: {
                            connected: false,
                            database: 'PostgreSQL',
                            error: error instanceof Error ? error.message : 'Unknown error',
                        },
                    };
                }
            })(),
        ]);

        // Determine overall health status
        const allHealthy = [mongo, postgres].every(service => service.status === 'healthy');

        return c.json({
            success: allHealthy,
            message: allHealthy ? 'All services are healthy' : 'Some services are unhealthy',
            services: {
                mongo,
                postgres,
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

// app.post('/servers/register', zValidator('json', RegisterServerSchema), ServerController.register);

// --- Authenticated Server Routes ---
app.use('/servers/*', serverAuth);
app.post('/servers/heartbeat', ServerController.heartbeat);
app.get('/servers/commands', ServerController.getCommands);
app.post(
    '/servers/commands/ack',
    zValidator('json', AckCommandSchema),
    ServerController.ackCommand
);

// --- Admin / Client API Routes ---
app.post('/schedule/worker/start', zValidator('json', StartWorkerSchema), async c => {
    const { clientId } = await c.req.json();
    const worker = await WorkerService.provisionWorker(clientId);
    return c.json({ worker });
});

app.post('/schedule/worker/stop', zValidator('json', StopWorkerSchema), async c => {
    const { workerId } = await c.req.json();
    await WorkerService.decommissionWorker(workerId);
    return c.json({ success: true });
});

// --- Background Jobs ---
console.log('⏱️ Starting Background Jobs...');

const startServer = async () => {
    try {
        await databaseConfig.connect();
        // make sure db is connected
        console.log('Database connected successfully');
        // cron.schedule('*/1 * * * *', async () => {
        //     try {
        //         await subscriptionsJob();
        //     } catch (err) {
        //         console.error('Monitor Job Failed:', err);
        //     }
        // });
        setInterval(async () => {
            try {
                await subscriptionsJob();
            } catch (err) {
                console.error('Monitor Job Failed:', err);
            }
        }, 60 * 1000);
        // Start HTTP server
        const server = Bun.serve({
            port: config.PORT,
            hostname: '0.0.0.0', // Ensure binding to all interfaces

            fetch: (req, server) => {
                if (server.upgrade(req)) {
                    return undefined; // Bun automatically handles the 101 Switching Protocols response
                }
                return app.fetch(req, server);
            },
            websocket: {
                message: (ws, msg) => Gateway.getInstance().handleMessage(ws, msg),
                open: ws => Gateway.getInstance().handleConnection(ws),
                close: ws => Gateway.getInstance().handleClose(ws),
            },
        });

        return server;
    } catch (error) {
        console.error('Failed to start server:', error as Error);
        process.exit(1);
    }
};

// Start the server
let server: any;

startServer()
    .then(startedServer => {
        server = startedServer;
        console.log(`🚀 Scheduler running at http://${server.hostname}:${server.port}`);
    })
    .catch(error => {
        console.error('Failed to start server:', error as Error);
        process.exit(1);
    });

export default server;
export { app };
