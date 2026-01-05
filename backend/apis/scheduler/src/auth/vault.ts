import { db } from '../db';
import { sql } from 'drizzle-orm';

export default function loadSecrets() {
    const secret = process.env.SCHEDULER_MASTER_SECRET;
    return secret;
}
