#!/usr/bin/env bun

import { bootstrap } from "./app/worker.bootstrap";
import { logger } from "@kyrazo/shared";

/**
 * @title Worker Service
 * @description Standalone NATS JetStream consumer service for processing webhook events.
 * Runs independently from the API server.
 *
 * @example
 * bun run src/index.ts
 */

async function main() {
    console.log("🚀 Starting NATS JetStream Worker Service...");

    try {
        const success = await bootstrap();
        if (!success) {
            logger.error("Worker failed to start during bootstrap. Exiting.");
            process.exit(1);
        }
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
