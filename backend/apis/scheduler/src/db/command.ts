import {
    pgTable,
    uuid,
    text,
    integer,
    timestamp,
    jsonb,
} from 'drizzle-orm/pg-core';
import { servers } from './server';

export const serverCommands = pgTable('server_commands', {
    command_id: uuid('command_id').defaultRandom().primaryKey(),
    server_id: uuid('server_id')
        .references(() => servers.server_id)
        .notNull(),
    type: text('type', {
        enum: ['START_WORKER', 'STOP_WORKER', 'SHUTDOWN'],
    }).notNull(),
    payload: jsonb('payload').notNull(),
    signature: text('signature').notNull(),
    nonce: text('nonce').notNull(),
    timestamp: integer('timestamp').notNull(),

    status: text('status', {
        enum: ['pending', 'acked', 'completed', 'failed'],
    })
        .default('pending')
        .notNull(),
    created_at: timestamp('created_at').defaultNow(),
    acked_at: timestamp('acked_at'),
});
