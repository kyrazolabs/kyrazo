import { readFileSync } from 'fs';
import { clickhouseConfig } from '../../../configs/clickhouse';

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
        console.log(`Executing SQL statement: ${stmt.substring(0, 100)}...`);
        try {
            await client.exec({
                query: stmt,
                clickhouse_settings: {
                    wait_end_of_query: 1,
                },
            });
            console.log(`Successfully executed statement`);
        } catch (error: any) {
            console.error(`Failed to execute statement: ${stmt.substring(0, 100)}...`, error);
            throw error;
        }
    }
}
