import { db } from '@/db';
import { clients, servers, workers } from '@/db/schema';
import { and, eq, sql } from 'drizzle-orm';

export class WorkerRepo {
    static async findAvailableServer(tx = db) {
        const [bestServer] = await tx
            .select()
            .from(servers)
            .where(
                and(
                    eq(servers.status, 'active'),
                    sql`${servers.active_workers} < ${servers.max_workers}`
                )
            )
            .orderBy(servers.active_workers)
            .limit(1);
        return bestServer;
    }

    static async getClientForUpdate(tx: any, clientId: string) {
        const result = await tx.execute(
            sql`SELECT * FROM ${clients} WHERE ${clients.client_id} = ${clientId} FOR UPDATE`
        );
        return result[0] as typeof clients.$inferSelect;
    }

    static async upsertClient(tx: any, clientId: string, maxWorkers: number) {
        await tx
            .insert(clients)
            .values({
                client_id: clientId,
                plan_max_workers: maxWorkers,
            })
            .onConflictDoUpdate({
                target: clients.client_id,
                set: {
                    plan_max_workers: maxWorkers,
                },
            });
    }

    static async lockCapacity(
        tx: any,
        clientId: string,
        serverId: string,
        currentServerActiveWorkers: number
    ) {
        await tx
            .update(clients)
            .set({ used_workers: sql`${clients.used_workers} + 1` })
            .where(eq(clients.client_id, clientId));

        await tx
            .update(servers)
            .set({ active_workers: currentServerActiveWorkers + 1 })
            .where(eq(servers.server_id, serverId));
    }

    static async createPendingWorker(tx: any, clientId: string, serverId: string) {
        const [newWorker] = await tx
            .insert(workers)
            .values({
                client_id: clientId,
                server_id: serverId,
                status: 'pending',
            })
            .returning();
        return newWorker;
    }

    static async getWorker(tx: any, workerId: string) {
        const [worker] = await tx.select().from(workers).where(eq(workers.worker_id, workerId));
        return worker;
    }

    static async setWorkerStopping(tx: any, workerId: string) {
        await tx.update(workers).set({ status: 'stopping' }).where(eq(workers.worker_id, workerId));
    }

    static async updateWorkerStatus(tx: any, workerId: string, status: string) {
        await tx
            .update(workers)
            .set({ status: status as any, updated_at: new Date() })
            .where(eq(workers.worker_id, workerId));
    }

    static async releaseResources(tx: any, clientId: string, serverId: string) {
        await tx.execute(
            sql`UPDATE ${clients} SET used_workers = used_workers - 1 WHERE ${clients.client_id} = ${clientId}`
        );
        await tx.execute(
            sql`UPDATE ${servers} SET active_workers = active_workers - 1 WHERE ${servers.server_id} = ${serverId}`
        );
    }

    static async reconcileServerCounts() {
        await db.execute(sql`
            UPDATE ${servers} s
            SET active_workers = (
                SELECT COUNT(*)
                FROM ${workers} w
                WHERE w.server_id = s.server_id
                AND w.status IN ('pending', 'starting', 'running', 'stopping')
            )
        `);
    }

    static async reconcileClientCounts() {
        await db.execute(sql`
            UPDATE ${clients} c
            SET used_workers = (
                SELECT COUNT(*)
                FROM ${workers} w
                WHERE w.client_id = c.client_id
                AND w.status IN ('pending', 'starting', 'running', 'stopping')
            )
        `);
    }
}
