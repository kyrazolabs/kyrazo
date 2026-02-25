import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const servers = pgTable('servers', {
    server_id: uuid('server_id').defaultRandom().primaryKey(),
    api_key: text('api_key').notNull(), // Secret key for authentication
    cores: integer('cores').notNull(),
    max_workers: integer('max_workers').notNull(), // Capacity
    active_workers: integer('active_workers').default(0).notNull(), // Current load
    status: text('status', { enum: ['active', 'draining', 'down'] })
        .default('active')
        .notNull(),
    ip: text('ip'), // Server's public IP address
    coolify_server_uuid: text('coolify_server_uuid'), // The Coolify ID for the server to deploy to
    coolify_project_uuid: text('coolify_project_uuid'), // The Coolify Project UUID
    coolify_environment_uuid: text('coolify_environment_uuid'), // The Coolify Environment UUID
    last_heartbeat: timestamp('last_heartbeat').defaultNow().notNull(),
    created_at: timestamp('created_at').defaultNow(),
});
