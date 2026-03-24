import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();
const sql = postgres(process.env.POSTGRES_URL!);
async function check() {
    const servers =
        await sql`SELECT server_id, api_key, ip, status, created_at FROM servers ORDER BY created_at DESC LIMIT 5`;
    console.log('Recent Servers:', servers);
    await sql.end();
}
check();
