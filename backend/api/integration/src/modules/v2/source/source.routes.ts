import { Hono } from 'hono';
import type { AppContext } from '@/core/middlewares/auth.middleware';

const router = new Hono<AppContext>();

export default router;
