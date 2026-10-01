import { runSqlFile } from './utils';
import { join } from 'path';

export async function createPublishedEventsTables() {
    const filePath = join(__dirname, '../sql/002_published_events.sql');
    await runSqlFile(filePath);
}
