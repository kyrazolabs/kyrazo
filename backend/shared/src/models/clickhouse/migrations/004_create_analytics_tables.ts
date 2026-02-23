import path from 'path';
import { runSqlFile } from './utils';

export async function createAnalyticsTables() {
    const sqlPath = path.join(__dirname, '../sql/004_analytics_tables.sql');
    await runSqlFile(sqlPath);
}
