import { pgTable, uuid, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { clients } from './client';
import { servers } from './server';

export const workerStatusEnum = pgEnum('status', [
    'pending',
    'starting',
    'running',
    'stopping',
    'stopped',
    'failed',
]);
export const workers = pgTable('workers', {
    worker_id: uuid('worker_id').defaultRandom().primaryKey(),
    client_id: text('client_id')
        .references(() => clients.client_id)
        .notNull(),
    server_id: uuid('server_id')
        .references(() => servers.server_id)
        .notNull(),

    status: workerStatusEnum().default('pending').notNull(),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
});
