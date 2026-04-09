import { Hono } from 'hono';
import cron from 'node-cron';
import { logger } from 'hono/logger';
import { config } from '@/common/config'; // Validation runs on import
import { globalErrorHandler } from '@/common/error';
import { subscriptionsJob } from './jobs/subscriptions.job';
import { databaseConfig, mongoose } from '@kyrazo/shared';
import { connectDB } from '@/db';

const app = new Hono();

app.use('*', logger());
app.onError(globalErrorHandler);

// --- Public Routes ---
app.get('/v1/health', async c => {
    try {
        // Check all services in parallel
        const mongo = await databaseConfig.healthCheck();

        // Determine overall health status
        const allHealthy = mongo.status === 'healthy';

        return c.json({
            success: allHealthy,
            message: allHealthy ? 'All services are healthy' : 'Some services are unhealthy',
            services: {
                mongo,
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

// --- Background Jobs ---
console.log('⏱️ Starting Background Jobs...');

const startServer = async () => {
    try {
        await connectDB();

        // Wait up to 5 seconds for full connectivity (readyState 1)
        let retries = 5;
        while (mongoose.connection.readyState !== 1 && retries > 0) {
            console.log(`⏳ Waiting for MongoDB full connectivity... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            retries--;
        }

        if (mongoose.connection.readyState !== 1) {
            console.warn('⚠️ MongoDB connected but readyState is not 1. Background jobs might face buffering timeouts.');
        } else {
            console.log('✅ Database connected and ready for operations');
        }

        // Start background job loop
        setInterval(async () => {
            try {
                await subscriptionsJob();
            } catch (err: any) {
                console.error('Monitor Job Failed:', err);
            }
        }, 60 * 1000);
        // Start HTTP server
        const server = Bun.serve({
            port: config.PORT,
            hostname: '0.0.0.0', // Ensure binding to all interfaces

            fetch: (req, server) => {
                return app.fetch(req, server);
            },
        });

        return server;
    } catch (error: any) {
        console.error('Failed to start server:', error);
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
        console.error('Failed to start server:', error);
        process.exit(1);
    });

export default server;
export { app };
