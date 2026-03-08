import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const clients = pgTable('clients', {
    client_id: text('client_id').primaryKey(), // External ID
    plan_max_workers: integer('plan_max_workers').notNull(),
    used_workers: integer('used_workers').default(0).notNull(),
    created_at: timestamp('created_at').defaultNow(),
});
