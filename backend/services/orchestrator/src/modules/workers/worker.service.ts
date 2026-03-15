import { db } from '@/db';
import { CommandDispatcher } from '@/modules/commands/command.dispatcher';
import { WorkerRepo } from './worker.repo';

export class WorkerService {
    /**
     * Finds the best available server based on load.
     */
    static async findAvailableServer(tx = db) {
        return await WorkerRepo.findAvailableServer(tx);
    }

    /**
     * Provision a new worker for a client.
     *
     * Two-phase approach:
     *   Phase 1 (Transaction): Lock capacity on server + client, create pending worker record.
     *   Phase 2 (Outside TX): Deploy via Coolify API. If it fails, rollback by marking failed.
     *
     * This prevents long-running Coolify HTTP calls from holding DB locks.
     */
    static async provisionWorker(clientId: string) {
        // Phase 1: Reserve capacity in a serializable transaction
        const { newWorker, serverId } = await db.transaction(async tx => {
            // Lock client row to prevent concurrent over-provisioning
            const client = await WorkerRepo.getClientForUpdate(tx, clientId);
            if (!client) throw new Error(`Client ${clientId} not found`);

            if (client.used_workers >= client.plan_max_workers) {
                throw new Error('Plan limit reached');
            }

            // Lock server row — FOR UPDATE prevents two TXs claiming the last slot
            const server = await WorkerRepo.findAvailableServerForUpdate(tx);
            if (!server) throw new Error('No available capacity');

            // Atomically increment counters
            await WorkerRepo.lockCapacity(tx, clientId, server.server_id);

            // Create the worker record
            const newWorker = await WorkerRepo.createPendingWorker(tx, clientId, server.server_id);
            if (!newWorker) throw new Error('Failed to create worker record');

            return { newWorker, serverId: server.server_id };
        });

        // Phase 2: Deploy on Coolify OUTSIDE the transaction
        try {
            await CommandDispatcher.dispatchStartWorker(serverId, newWorker.worker_id, clientId);
        } catch (err) {
            // Coolify deploy failed — rollback by marking worker as failed (releases resources)
            console.error(
                `[WorkerService] Coolify deploy failed for worker ${newWorker.worker_id}. Rolling back.`
            );
            await WorkerService.updateWorkerStatus(newWorker.worker_id, 'failed');
            throw err;
        }

        return newWorker;
    }

    /**
     * Decommission a worker.
     */
    static async decommissionWorker(workerId: string, apps?: any[]) {
        return await db.transaction(async tx => {
            const worker = await WorkerRepo.getWorker(tx, workerId);

            if (!worker) throw new Error('Worker not found');
            if (worker.status === 'stopped') return;

            // 1. Update status
            await WorkerRepo.setWorkerStopping(tx, workerId);

            // 2. Dispatch Stop
            await CommandDispatcher.dispatchStopWorker(
                worker.server_id,
                workerId,
                worker.client_id,
                false,
                apps
            );
        });
    }

    /**
     * Update worker status. If transitioning to a terminal state (stopped/failed),
     * atomically release capacity on both the client and server.
     */
    static async updateWorkerStatus(workerId: string, status: string) {
        await db.transaction(async tx => {
            const currentWorker = await WorkerRepo.getWorker(tx, workerId);

            if (!currentWorker) return;

            // Update status
            await WorkerRepo.updateWorkerStatus(tx, workerId, status);

            // If transitioning to terminal state, release resources
            if (
                ['stopped', 'failed'].includes(status) &&
                !['stopped', 'failed'].includes(currentWorker.status)
            ) {
                await WorkerRepo.releaseResources(
                    tx,
                    currentWorker.client_id,
                    currentWorker.server_id
                );
                console.log(`[WorkerService] Released resources for worker ${workerId}`);
            }
        });

        console.log(`✅ Worker ${workerId} status updated to ${status}`);
    }

    /**
     * Reap stale terminated workers from the DB.
     * Deletes Coolify apps first, then removes the DB records.
     *
     * @param kyrazoApps - Pre-fetched list of Coolify apps for efficient lookup.
     * @param ttlMs - How long a worker must be in stopped/failed before reaping (default 1h).
     */
    static async reapStaleWorkers(kyrazoApps: any[] = [], ttlMs: number = 60 * 60 * 1000) {
        const staleWorkers = await WorkerRepo.findStaleTerminatedWorkers(ttlMs);

        if (staleWorkers.length === 0) return;

        console.log(`[WorkerService] Reaping ${staleWorkers.length} stale terminated worker(s)...`);

        for (const w of staleWorkers) {
            try {
                // Attempt to delete Coolify app if it still exists
                await CommandDispatcher.dispatchStopWorker('', w.worker_id, '', true, kyrazoApps);
            } catch (err) {
                console.warn(`[WorkerService] Failed to delete Coolify app for stale worker ${w.worker_id}:`, err);
            }

            try {
                // Delete the DB record
                await db.transaction(async tx => {
                    await WorkerRepo.deleteWorker(tx, w.worker_id);
                });
                console.log(`[WorkerService] Reaped stale worker ${w.worker_id}`);
            } catch (err) {
                console.error(`[WorkerService] Failed to delete DB record for worker ${w.worker_id}:`, err);
            }
        }
    }

    static async reconcileServerCounts() {
        await WorkerRepo.reconcileServerCounts();
    }

    /**
     * Periodically reconcile client stats to fix drift.
     */
    static async reconcileClientCounts() {
        await WorkerRepo.reconcileClientCounts();
    }
}
