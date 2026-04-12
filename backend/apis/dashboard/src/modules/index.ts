import { Hono } from 'hono';
import v1Router from './v1/router';
import v2Router from './v2/router';

const router = new Hono();

router.route('/v1/', v1Router);
router.route('/v2/', v2Router);

export type AppType = typeof router;
export default router;
