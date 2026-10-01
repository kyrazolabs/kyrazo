import { runSqlFile } from './utils';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function createIngestEventsTable() {
    const filePath = join(__dirname, '../sql/003_ingest_events.sql');
    await runSqlFile(filePath);
}
