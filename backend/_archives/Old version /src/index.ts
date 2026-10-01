#!/usr/bin/env bun

import {
    clickhouseConfig,
    config,
    databaseConfig,
    natsConfig,
    redisConfig,
} from "./config";
import { logger } from "@/utils";
import { workerConsumer } from "./consumer";
import { publishConsumer } from "./consumers/events/publish.consumer";
import { receiveConsumer } from "./consumers/events/receive.consumer";
import { routeConsumer } from "./consumers/events/route.consumer";

/**
 * @title Worker Service
 * @description Standalone NATS JetStream consumer service for processing webhook events.
 * Runs independently from the API server.
 *
 * @example
 * bun run src/index.ts
 */
const initializeConnections = async () => {
    try {
        await databaseConfig.connect();
        logger.info("Database connected successfully");

        await redisConfig.connect();
        logger.info("Redis connected successfully");

        await clickhouseConfig.connect();
        logger.info("ClickHouse connected successfully");

        await natsConfig.connect().then(() => {
            logger.info("NATS connected successfully");
        });
        return true;
    } catch (error) {
        logger.error("Failed to initialize connections:", error);
        return false;
    }
};

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    // Close database connection
    databaseConfig
        .disconnect()
        .then(() => {
            logger.info("Database connection closed");
        })
        .catch((error) => {
            logger.error("Error closing database connection:", error);
        });

    // Close Redis connection
    redisConfig
        .disconnect()
        .then(() => {
            logger.info("Redis connection closed");
        })
        .catch((error) => {
            logger.error("Error closing Redis connection:", error);
        });

    natsConfig
        .disconnect()
        .then(() => {
            logger.info("NATS connection closed");
        })
        .catch((error) => {
            logger.error("Error closing NATS connection:", error);
        });

    // Close ClickHouse connection
    clickhouseConfig.getClient(); // فقط للتأكد client موجود
    logger.info("ClickHouse connection closed (client reference cleared)");

    await publishConsumer.stop();
    await receiveConsumer.stop();
    await routeConsumer.stop();

    // Force close after 30 seconds
    setTimeout(() => {
        logger.error(
            "Could not close connections in time, forcefully shutting down"
        );
        process.exit(1);
    }, 30000);
};
async function main() {
    console.log("🚀 Starting NATS JetStream Worker Service...");

    try {
        // Initialize connections
        const connectionsReady = await initializeConnections();
        if (!connectionsReady) {
            logger.error("Failed to initialize connections. Exiting...");
            process.exit(1);
        }

        await workerConsumer.start();
        logger.info("Worker started successfully");
    } catch (error) {
        console.error("❌ Failed to start worker service:", error);
        process.exit(1);
    }
}

// Start the worker service
main().catch((error) => {
    logger.error("Failed to start worker:", error);
    process.exit(1);
});

// Handle graceful shutdown
process.on("SIGINT", async () => {
    logger.debug("\n👋 Shutting down worker...");
    await gracefulShutdown("SIGINT");
    process.exit(0);
});

process.on("SIGTERM", async () => {
    logger.debug("\n👋 Shutting down worker...");
    await gracefulShutdown("SIGTERM");
    process.exit(0);
});

process.on("uncaughtException", async (error) => {
    logger.error("Uncaught Exception:", error);
    await gracefulShutdown("uncaughtException");
    process.exit(1);
});
