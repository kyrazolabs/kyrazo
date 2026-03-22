import { Hono } from 'hono';
import { workerController } from './worker.controller';
import { authenticate } from '@/core/middlewares/auth.middleware';
import { requireWorkspaceMembership } from '@/core/middlewares/workspace.middleware';
import { workerReadRateLimiter } from './worker.ratelimiter';

const worker = new Hono();

// All worker routes require authentication
worker.use(authenticate);

// Require workspace membership for all routes
worker.use(requireWorkspaceMembership());

worker.get('/status', workerReadRateLimiter, c => workerController.getStatus(c));

export default worker;
