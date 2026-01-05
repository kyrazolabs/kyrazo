import { runSqlFile } from './utils';
import { join } from 'path';

export async function createReceivedEventsTables() {
    const filePath = join(__dirname, '../sql/004_received_events.sql');
    await runSqlFile(filePath);
}
