import { runSqlFile } from './utils';
import { join } from 'path';

export async function createRoutedEventsTables() {
    const filePath = join(__dirname, '../sql/005_routed_events.sql');
    await runSqlFile(filePath);
}
