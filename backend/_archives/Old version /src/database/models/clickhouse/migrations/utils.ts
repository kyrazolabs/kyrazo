import { readFileSync } from 'fs';
import { clickhouseConfig } from '@/config';

/**
 * @title runSqlFile
 * @description Reads an external .sql file and executes its statements sequentially.
 */
export async function runSqlFile(filePath: string) {
    const client = clickhouseConfig.getClient();
    const sql = readFileSync(filePath, 'utf-8');

    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

    for (const stmt of statements) {
        await client.exec({
            query: stmt,
            clickhouse_settings: {
                wait_end_of_query: 1,
              },
        });
    }
}
