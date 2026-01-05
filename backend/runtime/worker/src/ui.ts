#!/usr/bin/env bun
/**
 * BullMQ Dashboard UI Server
 * Provides a web interface to monitor queue status and job processing
 */

import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import express, { type Request, type Response } from "express";
import { config, redisConfig } from "@/config";
import { dispatchConsumer } from "./consumers/queues/dispatch.consumer";
import { dispatchProducer } from "./consumers/batch/dispatch.producer";
import { ingestProducer } from "./consumers/batch/ingest.producer";
import { env } from "./app/worker.env";

const app = express();
const PORT = 3004;

// Create Bull Board adapter
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

// Add middleware
app.use("/admin/queues", serverAdapter.getRouter());

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
    res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: env.worker.VERSION,
    });
});

// Start server
const startServer = async () => {
    try {
        await redisConfig.connect();
        await dispatchConsumer.initialize();
        await dispatchProducer.initialize();
        await ingestProducer.initialize();

        // Create Bull Board with queue adapters
        createBullBoard({
            queues: [
                new BullMQAdapter(dispatchConsumer["dispatchQueue"]!),
                new BullMQAdapter(dispatchProducer.getQueues().DispatchsQueue),
                new BullMQAdapter(ingestProducer.getQueues().IngestQueue),
            ],
            serverAdapter: serverAdapter,
        });

        const server = app.listen(PORT, () => {
            console.log(
                `🚀 BullMQ Dashboard running on http://localhost:${PORT}/admin/queues`,
            );
            console.log(
                `📊 Queue stats API available at http://localhost:${PORT}/api/queues/stats`,
            );
            console.log(
                `❤️  Health check available at http://localhost:${PORT}/health`,
            );
        });

        // Graceful shutdown
        const shutdown = async () => {
            console.log("🔄 Shutting down BullMQ Dashboard...");
            server.close(async () => {
                await redisConfig.disconnect();
                console.log("✅ BullMQ Dashboard shutdown complete");
            });
        };

        process.on("SIGTERM", shutdown);
        process.on("SIGINT", shutdown);
    } catch (error) {
        console.error("❌ Failed to start BullMQ Dashboard:", error);
        process.exit(1);
    }
};

startServer();
