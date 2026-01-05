import { runSqlFile } from './utils';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function createDeliveryAttemptsTable() {
    const filePath = join(__dirname, '../sql/001_delivery_attempts.sql');
    await runSqlFile(filePath);
}
