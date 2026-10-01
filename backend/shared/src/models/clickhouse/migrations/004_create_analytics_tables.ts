import { runSqlFile } from './utils';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function createAnalyticsTables() {
    const sqlPath = join(__dirname, '../sql/004_analytics_tables.sql');
    await runSqlFile(sqlPath);
}
