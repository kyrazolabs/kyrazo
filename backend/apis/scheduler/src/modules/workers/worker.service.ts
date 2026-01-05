import { db } from '@/db';
import { clients, servers, workers } from '@/db/schema';
import { CommandDispatcher } from '@/modules/commands/command.dispatcher';
import { and, eq, sql } from 'drizzle-orm';

export class WorkerService {
    /**
     * Finds the best available server based on load.
     */
    static async findAvailableServer(tx = db) {
        // Simple Load Balancing: Least connections
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

    /**
     * Provision a new worker for a client.
     * Manages DB state and delegates command dispatch.
     */
    static async provisionWorker(clientId: string) {
        return await db.transaction(async tx => {
            // 1. Check Client Plan & Limits
            // 1. Check Client Plan & Limits (with LOCK)
            // Use raw SQL for "FOR UPDATE" to prevent race conditions
            const result = await tx.execute(
                sql`SELECT * FROM ${clients} WHERE ${clients.client_id} = ${clientId} FOR UPDATE`
            );
            const client = result[0] as typeof clients.$inferSelect;

            if (!client) throw new Error(`Client ${clientId} not found`);

            // Check limit
            if (client.used_workers >= client.plan_max_workers) {
                // Determine if we should throw or just return null (soft limit)
                throw new Error('Plan limit reached');
            }

            // 2. Find Server
            const server = await WorkerService.findAvailableServer(tx as any);
            if (!server) throw new Error('No available capacity');

            // 3. Update State (Lock capacity)
            await tx
                .update(clients)
                .set({ used_workers: sql`${clients.used_workers} + 1` })
                .where(eq(clients.client_id, clientId));

            await tx
                .update(servers)
                .set({ active_workers: server.active_workers + 1 })
                .where(eq(servers.server_id, server.server_id));

            // 4. Create Worker Record
            const [newWorker] = await tx
                .insert(workers)
                .values({
                    client_id: clientId,
                    server_id: server.server_id,
                    status: 'pending',
                })
                .returning();

            if (!newWorker) throw new Error('Failed to create worker record');

            // 5. Dispatch Command (Side Effect - do this AFTER DB commit ideally, but inside logic flow)
            // Note: If dispatch fails, we still reserved the spot.
            // Queue via DB in Dispatcher ensures reliability.
            await CommandDispatcher.dispatchStartWorker(
                server.server_id,
                newWorker.worker_id,
                clientId
            );

            return newWorker;
        });
    }

    /**
     * Decommission a worker.
     */
    static async decommissionWorker(workerId: string) {
        return await db.transaction(async tx => {
            const [worker] = await tx
                .select()
                .from(workers)
                .where(eq(workers.worker_id, workerId));

            if (!worker) throw new Error('Worker not found');
            if (worker.status === 'stopped') return;

            // 1. Update status
            await tx
                .update(workers)
                .set({ status: 'stopping' })
                .where(eq(workers.worker_id, workerId));

            // 2. Dispatch Stop
            await CommandDispatcher.dispatchStopWorker(
                worker.server_id,
                workerId,
                worker.client_id
            );
        });
    }

    /**
     * Update worker status (called by Gateway).
     */
    static async updateWorkerStatus(workerId: string, status: string) {
        await db.transaction(async tx => {
            const [currentWorker] = await tx
                .select()
                .from(workers)
                .where(eq(workers.worker_id, workerId));

            if (!currentWorker) return;

            // Update status
            await tx
                .update(workers)
                .set({ status: status as any, updated_at: new Date() })
                .where(eq(workers.worker_id, workerId));

            // If terminal state, release resources
            if (
                ['stopped', 'failed'].includes(status) &&
                !['stopped', 'failed'].includes(currentWorker.status)
            ) {
                // Decrement Client Count
                await tx.execute(
                    sql`UPDATE ${clients} SET used_workers = used_workers - 1 WHERE ${clients.client_id} = ${currentWorker.client_id}`
                );
                // Decrement Server Count
                await tx.execute(
                    sql`UPDATE ${servers} SET active_workers = active_workers - 1 WHERE ${servers.server_id} = ${currentWorker.server_id}`
                );
                console.log(
                    `[WorkerService] Released resources for worker ${workerId}`
                );
            }
        });

        console.log(`✅ Worker ${workerId} status updated to ${status}`);
    }

    /**
     * Periodically reconcile server stats to fix drift.
     */
    static async reconcileServerCounts() {
        // Recalculate active_workers for all servers based on actual worker rows
        // active_workers = count of workers where status IN ('pending', 'starting', 'running')
        await db.execute(sql`
            UPDATE ${servers} s
            SET active_workers = (
                SELECT COUNT(*) 
                FROM ${workers} w 
                WHERE w.server_id = s.server_id 
                AND w.status IN ('pending', 'starting', 'running')
            )
        `);
    }

    /**
     * Periodically reconcile client stats to fix drift.
     */
    static async reconcileClientCounts() {
        // Recalculate used_workers for all clients
        await db.execute(sql`
            UPDATE ${clients} c
            SET used_workers = (
                SELECT COUNT(*)
                FROM ${workers} w
                WHERE w.client_id = c.client_id
                AND w.status IN ('pending', 'starting', 'running')
            )
        `);
    }
}
