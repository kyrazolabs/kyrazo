import { runSqlFile } from './utils';
import { join } from 'path';

export async function createPublishedEventsTargetsTables() {
    const filePath = join(__dirname, '../sql/003_published_event_targets.sql');
    await runSqlFile(filePath);
}
