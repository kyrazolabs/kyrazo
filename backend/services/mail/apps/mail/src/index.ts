import "dotenv/config"; // It must be the first import
import "./lib/bullMQ/workers/workers.js";
import { redisBullmqClient } from "./lib/bullMQ/config.bullmq.js";

const port = process.env.PORT || 4040;

Bun.serve({
  port: Number(port),
  hostname: "0.0.0.0",
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/health") {
      try {
        // Check Redis queue health
        const redisQueue = await (async () => {
          try {
            const ping = await redisBullmqClient.ping();
            const info = await redisBullmqClient.info("server");
            return {
              status: "healthy",
              details: {
                connected: redisBullmqClient.status === "ready",
                ping,
                serverInfo: info.split("\r\n").slice(0, 5).join("\n"),
              },
            };
          } catch (error) {
            return {
              status: "unhealthy",
              details: {
                connected: false,
                error: error instanceof Error ? error.message : "Unknown error",
              },
            };
          }
        })();

        // Determine overall health status
        const allHealthy = redisQueue.status === "healthy";

        return Response.json(
          {
            success: allHealthy,
            message: allHealthy
              ? "All services are healthy"
              : "Some services are unhealthy",
            services: {
              redisQueue,
            },
            timestamp: new Date().toISOString(),
            version: "1.0.0",
          },
          {
            status: allHealthy ? 200 : 503,
          },
        );
      } catch (error) {
        return Response.json(
          {
            success: false,
            message: "Health check failed",
            error: error instanceof Error ? error.message : "Unknown error",
            timestamp: new Date().toISOString(),
            version: "1.0.0",
          },
          {
            status: 500,
          },
        );
      }
    }
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Health check server running on port ${port}`);
