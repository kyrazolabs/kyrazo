#!/usr/bin/env bun
/**
 * BullMQ Dashboard UI Server
 * Provides a web interface to monitor queue status and job processing
 */

import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import express, { Request, Response } from "express";
import { config } from "@/config/app.config";
import { eventProcessor } from "./consumers/jobs/event.processor";

const app = express();
const PORT = 3004;

// Create Bull Board adapter
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

// Create Bull Board with queue adapters
const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
	queues: [
		new BullMQAdapter(eventProcessor["dispatchQueue"]),
		new BullMQAdapter(eventProcessor["batchQueue"]),
	],
	serverAdapter: serverAdapter,
});

// Add middleware
app.use("/admin/queues", serverAdapter.getRouter());

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
	res.json({
		status: "healthy",
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
		version: config.worker.version,
	});
});

// Queue statistics endpoint
app.get("/api/queues/stats", async (req: Request, res: Response) => {
	try {
		const stats = await eventProcessor.getQueueStats();
		const metrics = eventProcessor.getMetrics();

		res.json({
			stats,
			metrics,
			timestamp: new Date().toISOString(),
		});
	} catch (error: any) {
		res.status(500).json({ error: error?.message || "Unknown error" });
	}
});

// Start server
const server = app.listen(PORT, () => {
	console.log(
		`🚀 BullMQ Dashboard running on http://localhost:${PORT}/admin/queues`
	);
	console.log(
		`📊 Queue stats API available at http://localhost:${PORT}/api/queues/stats`
	);
	console.log(
		`❤️  Health check available at http://localhost:${PORT}/health`
	);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
	console.log("🔄 Shutting down BullMQ Dashboard...");
	server.close(() => {
		console.log("✅ BullMQ Dashboard shutdown complete");
	});
});

process.on("SIGINT", async () => {
	console.log("🔄 Shutting down BullMQ Dashboard...");
	server.close(() => {
		console.log("✅ BullMQ Dashboard shutdown complete");
	});
});

export { app, server };
