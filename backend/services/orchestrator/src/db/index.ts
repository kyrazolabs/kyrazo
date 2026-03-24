import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as fs from 'fs';
import * as schema from './schema';
import { config } from '../common/config';

const connectionString = config.POSTGRES_URL;

if (!connectionString) {
    throw new Error('POSTGRES_URL is not defined');
}

let sslConfig: any = false;
if ((config as any).POSTGRES_SSL) {
    if (
        (config as any).POSTGRES_SSL_MODE === 'verify-ca' ||
        (config as any).POSTGRES_SSL_MODE === 'verify-full'
    ) {
        sslConfig = {
            ca: (config as any).POSTGRES_CA_FILE
                ? fs.readFileSync((config as any).POSTGRES_CA_FILE).toString()
                : undefined,
        };
    } else {
        sslConfig = 'require';
    }
}

// Disable prefetch as it is not supported for "Transaction" pool mode
export const client = postgres(connectionString, { prepare: false, ssl: sslConfig });
export const db = drizzle(client, { schema });
