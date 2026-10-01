import { createDeliveryAttemptsTables } from './001_create_delivery_attempts';
import { createPublishedEventsTables } from './002_create_published_events';
import { createPublishedEventsTargetsTables } from './003_create_published_events_targets';
import { createReceivedEventsTables } from './004_create_received_events';
import { createRoutedEventsTables } from './005_create_routed_events';

export async function runMigrations() {
    await createDeliveryAttemptsTables();
    await createPublishedEventsTables();
    await createPublishedEventsTargetsTables();
    await createReceivedEventsTables();
    await createRoutedEventsTables();
}

