import { pgTable, uuid, text, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const serverStatusEnum = pgEnum('server_status', ['active', 'draining', 'down']);
export const servers = pgTable('servers', {
    server_id: uuid('server_id').defaultRandom().primaryKey(),
    cores: integer('cores').notNull(),
    max_workers: integer('max_workers').notNull(), // Capacity
    active_workers: integer('active_workers').default(0).notNull(), // Current load
    status: serverStatusEnum().default('active').notNull(),
    ipv4: text('ipv4'), // Server's public IP address
    ipv6: text('ipv6'), // Server's public IP address
    coolify_server_uuid: text('coolify_server_uuid'), // The Coolify ID for the server to deploy to
    coolify_project_uuid: text('coolify_project_uuid'), // The Coolify Project UUID
    coolify_environment_uuid: text('coolify_environment_uuid'), // The Coolify Environment UUID
    last_heartbeat: timestamp('last_heartbeat').defaultNow().notNull(),
    created_at: timestamp('created_at').defaultNow(),
});
