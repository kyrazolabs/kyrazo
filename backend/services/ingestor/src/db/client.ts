import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as fs from 'fs';
import * as schema from './schema';
import { Config } from '../config';

const config = Config.get();
const connectionString = config.pgUrl;

if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
}

let sslConfig: any = false;
if (config.pgSsl) {
    if (config.pgSslMode === 'verify-ca' || config.pgSslMode === 'verify-full') {
        sslConfig = {
            ca: config.pgCaFile ? fs.readFileSync(config.pgCaFile).toString() : undefined,
        };
        // Note: postgres-js behavior differs slightly from pg-node for verify-ca vs verify-full
    } else {
        sslConfig = 'require';
    }
}

// Disable prefetch as it is not supported for "Transaction" pool mode
export const client = postgres(connectionString, { 
    max: 20, 
    prepare: false,
    ssl: sslConfig
});
export const db = drizzle(client, { schema });
