import { Hono } from 'hono';
import eventsRouter from './v1/events/event.routes';
import targetsRouter from './v1/targets/target.routes';
import endpointsRouter from './v1/endpoints/endpoint.routes';
import sourceRouter from './v1/source/source.routes';
import type { AppContext } from '@/core/middlewares/auth.middleware';

const router = new Hono();

// Mount routes
router.route('/events', eventsRouter);
router.route('/targets', targetsRouter);
router.route('/endpoints', endpointsRouter);
router.route('/source', sourceRouter);

// Health check endpoint
router.get('/health', (c: AppContext) => {
    return c.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    });
});

export type AppType = typeof router;
export default router;
