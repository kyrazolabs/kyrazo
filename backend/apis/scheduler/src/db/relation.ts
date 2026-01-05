import { relations } from 'drizzle-orm';
import { clients } from './client';
import { serverCommands } from './command';
import { servers } from './server';
import { workers } from './worker';

export const serversRelations = relations(servers, ({ many }) => ({
    workers: many(workers),
    commands: many(serverCommands),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
    workers: many(workers),
}));

export const workersRelations = relations(workers, ({ one }) => ({
    server: one(servers, {
        fields: [workers.server_id],
        references: [servers.server_id],
    }),
    client: one(clients, {
        fields: [workers.client_id],
        references: [clients.client_id],
    }),
}));

export const serverCommandsRelations = relations(serverCommands, ({ one }) => ({
    server: one(servers, {
        fields: [serverCommands.server_id],
        references: [servers.server_id],
    }),
}));
