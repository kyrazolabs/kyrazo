import { db } from './src/db/index';
import { servers } from './src/db/schema';
import { desc } from 'drizzle-orm';

async function check() {
    const result = await db.select().from(servers).orderBy(desc(servers.created_at)).limit(5);
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
}
check();
