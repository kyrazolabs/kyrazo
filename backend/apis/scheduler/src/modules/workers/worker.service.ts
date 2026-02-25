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
     * Manages DB state and delegates command dispatch.
     */
    static async provisionWorker(clientId: string) {
        return await db.transaction(async tx => {
            // 1. Check Client Plan & Limits (with LOCK)
            const client = await WorkerRepo.getClientForUpdate(tx, clientId);
            if (!client) throw new Error(`Client ${clientId} not found`);

            // Check limit
            if (client.used_workers >= client.plan_max_workers) {
                throw new Error('Plan limit reached');
            }

            // 2. Find Server
            const server = await WorkerRepo.findAvailableServer(tx as any);
            if (!server) throw new Error('No available capacity');

            // 3. Update State (Lock capacity)
            await WorkerRepo.lockCapacity(tx, clientId, server.server_id, server.active_workers);

            // 4. Create Worker Record
            const newWorker = await WorkerRepo.createPendingWorker(tx, clientId, server.server_id);

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
            const worker = await WorkerRepo.getWorker(tx, workerId);

            if (!worker) throw new Error('Worker not found');
            if (worker.status === 'stopped') return;

            // 1. Update status
            await WorkerRepo.setWorkerStopping(tx, workerId);

            // 2. Dispatch Stop
            await CommandDispatcher.dispatchStopWorker(
                worker.server_id,
                workerId,
                worker.client_id
            );
        });
    }

    /**
     * Update worker status.
     */
    static async updateWorkerStatus(workerId: string, status: string) {
        await db.transaction(async tx => {
            const currentWorker = await WorkerRepo.getWorker(tx, workerId);

            if (!currentWorker) return;

            // Update status
            await WorkerRepo.updateWorkerStatus(tx, workerId, status);

            // If terminal state, release resources
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
