import { Hono } from 'hono';
import { logger as honoLogger } from 'hono/logger';
import { requestId as RequestId } from 'hono/request-id';
import { cors } from 'hono/cors';

import { redisConfig, config } from './configs';

import cron from 'node-cron';
import { billingJob } from './jobs/billing.job';

import {
    databaseConfig,
    clickhouseConfig,
    Endpoint,
    postgresConfig,
    logger,
} from '@kyrazo/shared';
// import { arcjetMiddleware } from '@/core/middlewares/arcjet.middleware'
import { errorHandler } from 'hono-error-handler';
import {
    handleMongooseErrors,
    zodErrorHandler,
} from '@/core/middlewares/error.middleware';

// BullMQ Board
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { HonoAdapter } from '@bull-board/hono';
import { usageService } from '@/shared/services/usage.service';
import { serveStatic } from 'hono/bun';

import v1Router from './modules';

const app = new Hono();

// Global middleware
app.use('*', RequestId());
app.use(honoLogger());
app.use(
    '*',
    cors({
        origin: config.security.corsOrigin, // Add your frontend URLs
        allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: [
            'Content-Type',
            'Authorization',
            'x-workspace-id',
            'x-project-id',
        ],
        credentials: config.security.corsCredentials,
    })
);
app.use('*', zodErrorHandler); // قبل errorHandler

// Security middleware
// app.use('*', arcjetMiddleware)

// Mount API routes
app.route('/v1', v1Router);

// Error handler
const errorHandlers = [handleMongooseErrors];
app.onError(errorHandler(errorHandlers));

// Initialize database and Redis connections
const initializeConnections = async () => {
    try {
        await databaseConfig.connect();
        logger.info('Database connected successfully');
        await Endpoint.syncIndexes();

        await postgresConfig.connect();
        logger.info('Postgres connected successfully');

        await redisConfig.connect();
        logger.info('Redis connected successfully');

        usageService.init();

        await clickhouseConfig.connect();
        logger.info('ClickHouse connected successfully');

        const serverAdapter = new HonoAdapter(serveStatic);

        createBullBoard({
            queues: [new BullMQAdapter(usageService.queue)],
            serverAdapter,
        });

        const basePath = '/ui';
        serverAdapter.setBasePath(basePath);
        app.route(basePath, serverAdapter.registerPlugin());

        return true;
    } catch (error) {
        logger.error('Failed to initialize connections:', error as Error);
        return false;
    }
};

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    // Close server
    if (server) {
        server.stop();
        logger.info('HTTP server closed');
    }

    // Close database connection

    databaseConfig
        .disconnect()
        .then(() => {
            logger.info('Database connection closed');
        })
        .catch(error => {
            logger.error('Error closing database connection:', error);
        });

    // Close Redis connection
    redisConfig
        .disconnect()
        .then(() => {
            logger.info('Redis connection closed');
        })
        .catch(error => {
            logger.error('Error closing Redis connection:', error);
        });

    // Close ClickHouse connection
    clickhouseConfig.getClient(); // فقط للتأكد client موجود
    logger.info('ClickHouse connection closed (client reference cleared)');

    // Close event workers
    // if (userMetricsWorker) {
    //   userMetricsWorker.close().then(() => {
    //     logger.info('Event workers closed');
    //   }).catch((error: any) => {
    //     logger.error('Error closing event workers:', error);
    //   });
    // }

    // // Close notification queue
    // const { closeNotificationQueue } = require('@/queues/notificationQueue');
    // closeNotificationQueue().then(() => {
    //   logger.info('Notification queue closed');
    //   process.exit(0);
    // }).catch((error: any) => {
    //   logger.error('Error closing notification queue:', error);
    //   process.exit(1);
    // });

    // Force close after 30 seconds
    setTimeout(() => {
        logger.error(
            'Could not close connections in time, forcefully shutting down'
        );
        process.exit(1);
    }, 30000);
};

// Start server
const startServer = async () => {
    try {
        // Initialize connections
        const connectionsReady = await initializeConnections();
        if (!connectionsReady) {
            logger.error('Failed to initialize connections. Exiting...');
            process.exit(1);
        }

        // Schedule Billing Job (Every hour)
        cron.schedule('*/1 * * * *', async () => {
            logger.info('Triggering scheduled Billing Job');
            await billingJob.run();
        });

        // Start HTTP server
        const server = Bun.serve({
            port: config.server.port,
            hostname: '0.0.0.0',
            fetch: app.fetch,
        });

        logger.info(
            `Server running on port ${config.server.port} in ${config.server.env} mode`
        );
        logger.info(
            `API documentation available at http://localhost:${config.server.port}/api/v1`
        );
        logger.info(
            `Health check available at http://localhost:${config.server.port}/health`
        );

        // Bun.serve() doesn't return a server object like Node.js
        // It starts the server immediately and throws if there's an error
        logger.info('Server started successfully');

        return server;
    } catch (error) {
        logger.error('Failed to start server:', error as Error);
        process.exit(1);
    }
};

// Start the server
let server: any;

startServer()
    .then(startedServer => {
        server = startedServer;
    })
    .catch(error => {
        logger.error('Failed to start server:', error as Error);
        process.exit(1);
    });

// Handle graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', error => {
    logger.error('Uncaught Exception:', error as Error);
    process.exit(1);
});

// // Handle unhandled promise rejections
// process.on('unhandledRejection', (reason, promise) => {
//   logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
//   process.exit(1);
// });

export default server;
export { app };
