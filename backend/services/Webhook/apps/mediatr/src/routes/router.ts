import { Hono } from "hono";
import mailRouter from "./paypal/paypal.router.js";

const router = new Hono();

// Mail Router
router.route("/mail", mailRouter);

export default router;
