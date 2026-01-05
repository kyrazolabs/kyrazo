import "dotenv/config"; // It must be the first import

import { serve } from "@hono/node-server";
import app from "./app.js";

serve(
  {
    fetch: app.fetch,
    port: Number(process.env.PORT || "3030"),
  },
  (info) => {
    console.info(`Mediatr server is running on http://localhost:${info.port}`);
  }
);
