import { Hono } from 'hono';
import eventsRouter from './v1/events/event.routes';
import targetsRouter from './v1/targets/target.routes';
import type { AppContext } from '@/core/middlewares/auth.middleware';

const router = new Hono();

// Mount routes
router.route('/events', eventsRouter);
router.route('/targets', targetsRouter);

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
