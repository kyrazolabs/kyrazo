import { Hono } from "hono";
import mailRouter from "./mail/send.router.js";

const router = new Hono();

// Mail Router
router.route("/mail", mailRouter);

export default router;
