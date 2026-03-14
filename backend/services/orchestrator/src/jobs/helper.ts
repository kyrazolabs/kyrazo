import { db } from '@/db';
import { servers } from '@/db/schema';
import { and, eq, sql } from 'drizzle-orm';

export async function findAvailableServer() {
    return db.query.servers.findFirst({
        where: and(
            eq(servers.status, 'active'),
            sql`${servers.active_workers} < ${servers.max_workers}`
        ),
        orderBy: sql`(${servers.max_workers} - ${servers.active_workers}) DESC`,
    });
}
