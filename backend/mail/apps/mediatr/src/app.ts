import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "hono/bun";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { HonoAdapter } from "@bull-board/hono";

import router from "./routes/router.js";
import { queues } from "./bullMQ/config.bullmq.js";

const app = new Hono();
const serverAdapter = new HonoAdapter(serveStatic);

createBullBoard({
    queues: [
        new BullMQAdapter(queues.sendMailHighPriorityQueue),
        new BullMQAdapter(queues.sendMailMediumPriorityQueue),
        new BullMQAdapter(queues.sendMailLowPriorityQueue),
    ],
    serverAdapter,
});
serverAdapter.setBasePath("/ui");

app.use(
    cors({
        origin: process.env.CLIENT_SERVER_LOCATION!,
        allowMethods: ["POST", "GET", "OPTIONS", "PUT"],
    })
);

app.use("*", (_, next) => {
    // IF want to perform any authentication check
    return next();
});

app.route("/api/v1", router);

app.route("/ui", serverAdapter.registerPlugin());

export default app;
