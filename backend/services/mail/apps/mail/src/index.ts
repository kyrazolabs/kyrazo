import "dotenv/config"; // It must be the first import
import "./lib/bullMQ/workers/workers.js";

const port = process.env.PORT || 4040;

Bun.serve({
  port: Number(port),
  hostname: "0.0.0.0",
  fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/health") {
      return Response.json({ status: "ok", service: "mail-service" });
    }
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Health check server running on port ${port}`);
