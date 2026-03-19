import { Next } from 'hono';
import { AppContext } from './auth.middleware';
import { aj } from '@/configs/arcjet';
import { isSpoofedBot } from '@arcjet/inspect';

export const arcjetMiddleware = async (c: AppContext, next: Next) => {
    try {
        const decision = await aj.protect(c.req.raw, { requested: 1 });

        if (decision.isDenied()) {
            if (decision.reason.isRateLimit()) {
                return c.json({ error: 'Too many requests' }, 429);
            } else if (decision.reason.isBot()) {
                return c.json({ error: 'No bots allowed' }, 403);
            } else {
                return c.json({ error: 'Forbidden' }, 403);
            }
        }

        if (decision.ip.isHosting()) {
            return c.json({ error: 'Forbidden' }, 403);
        }

        if (decision.results.some(isSpoofedBot)) {
            return c.json({ error: 'Forbidden' }, 403);
        }

        return next();
    } catch (error: any) {
        console.log(`Arcjet Middleware Error: ${error}`);
        return next();
    }
};
