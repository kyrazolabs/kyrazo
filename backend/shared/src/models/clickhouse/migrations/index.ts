import { createDeliveryAttemptsTable } from './001_create_delivery_attempts';
import { createDispatchedEventsTable } from './002_create_dispatched_events';
import { createIngestEventsTable } from './003_create_ingest_events';

export async function runMigrations() {
    console.log('Running ClickHouse migrations...');
    await createDeliveryAttemptsTable();
    await createDispatchedEventsTable();
    await createIngestEventsTable();
    console.log('ClickHouse migrations completed.');
}
