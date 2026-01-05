import type { Context, Next } from 'hono';
import { db } from '../db';
import { servers } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export const serverAuth = async (c: Context, next: Next) => {
    const serverKey =
        c.req.header('X-Server-Key') || c.req.header('x-server-key');
    const serverId = c.req.header('X-Server-Id') || c.req.header('x-server-id');

    if (!serverKey || !serverId) {
        return c.json(
            { error: 'Missing X-Server-Key or X-Server-Id header' },
            401
        );
    }

    const server = await db.query.servers.findFirst({
        where: and(
            eq(servers.server_id, serverId),
            eq(servers.api_key, serverKey),
            eq(servers.status, 'active')
        ),
    });

    if (!server) {
        return c.json({ error: 'Invalid API Key' }, 401);
    }

    if (server.status === 'down') {
        // Optional: Auto-recover server if it was marked down but is now communicating?
        // For now, just allow access, logic elsewhere handles status updates.
    }

    // Attach server to context
    c.set('server', server);

    await next();
};
