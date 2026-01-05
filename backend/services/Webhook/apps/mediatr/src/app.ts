import { Hono } from "hono";
import router from "./routes/router.js";
import { cors } from "hono/cors";

const app = new Hono();

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

export default app;
