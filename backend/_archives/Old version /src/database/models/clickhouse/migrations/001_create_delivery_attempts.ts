import { runSqlFile } from './utils';
import { join } from 'path';

export async function createDeliveryAttemptsTables() {
    const filePath = join(__dirname, '../sql/001_delivery_attempts.sql');
    await runSqlFile(filePath);
}
