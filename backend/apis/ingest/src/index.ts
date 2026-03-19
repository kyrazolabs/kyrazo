import { Hono } from 'hono';
import { logger as honoLogger } from 'hono/logger';
import { requestId as RequestId } from 'hono/request-id';
import { cors } from 'hono/cors';

import { redisConfig, config, natsConfig } from './configs';

// import { arcjetMiddleware } from '@/middlewares/arcjet.middleware'
import { errorHandler } from 'hono-error-handler';
import { handleMongooseErrors, zodErrorHandler } from '@/core/middlewares/error.middleware';

// BullMQ Board
// import { createBullBoard } from '@bull-board/api';
// import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
// import { HonoAdapter } from '@bull-board/hono';
// import { EventSenderQueue } from '@/events/producers/queues/event.queues';
// import { workers } from '@/events/consumers/workers';
// import { redisMongoSynchronizer } from '@/events/sync/redisToMongo';

import v1Router from './modules';
import { databaseConfig, logger } from '@kyrazo/shared';

const app = new Hono();

// const serverAdapter = new HonoAdapter(serveStatic);

// createBullBoard({
//   queues: [new BullMQAdapter(EventSenderQueue)],
//   serverAdapter,
// });

// const basePath = '/ui'
// serverAdapter.setBasePath(basePath);
// app.route(basePath, serverAdapter.registerPlugin());

// Global middleware
app.use('*', RequestId());
app.use(honoLogger());
app.use(
    '*',
    cors({
        origin: '*',
        allowMethods: ['POST', 'GET', 'OPTIONS'],
        maxAge: 600,
        credentials: true,
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

        await redisConfig.connect();
        logger.info('Redis connected successfully');

        await natsConfig.connect().then(() => {
            logger.info('NATS connected successfully');
        });
        return true;
    } catch (error: any) {
        logger.error('Failed to initialize connections', error);
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

    natsConfig
        .disconnect()
        .then(() => {
            logger.info('NATS connection closed');
        })
        .catch(error => {
            logger.error('Error closing NATS connection:', error);
        });

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
        logger.error('Could not close connections in time, forcefully shutting down');
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

        // Start HTTP server
        const server = Bun.serve({
            port: config.server.port,
            hostname: config.server.host,
            fetch: app.fetch,
        });

        logger.info(`Server running on port ${config.server.port} in ${config.server.env} mode`);
        logger.info(`API documentation available at http://localhost:${config.server.port}/api/v1`);
        logger.info(`Health check available at http://localhost:${config.server.port}/health`);

        logger.info('Server started successfully');

        return server;
    } catch (error: any) {
        logger.error('Failed to start server:', error);
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
        logger.error('Failed to start server:', error);
        process.exit(1);
    });

// Handle graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', error => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

export default server;
export { app };
