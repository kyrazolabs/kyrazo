import "dotenv/config"; // It must be the first import

import app from "./app.js";

let server: any;

try {
    server = Bun.serve({
        fetch: app.fetch,
        port: Number(process.env.PORT || "3030"),
    });
    `Server running on port ${process.env.PORT} in ${process.env.NODE_ENV} mode`;
} catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
}

export default server;
