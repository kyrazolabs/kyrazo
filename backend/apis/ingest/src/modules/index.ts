import { Hono, type Context } from 'hono';
import ingestRouter from './v1/ingest/ingest.routes';

const router = new Hono();

// Mount ingest routes
router.route('/', ingestRouter);

// Health check endpoint
router.get('/health', (c: Context) => {
    return c.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
    });
});

export type AppType = typeof router;
export default router;
