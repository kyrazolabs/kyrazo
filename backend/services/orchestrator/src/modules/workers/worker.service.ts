import { OrchestratorWorker, WorkerStatus, mongoose } from '@kyrazo/shared';
import { CommandDispatcher } from '@/modules/commands/command.dispatcher';
import { WorkerRepo } from './worker.repo';

export class WorkerService {
    /**
     * Finds the best available server based on load.
     */
    static async findAvailableServer() {
        return await WorkerRepo.findAvailableServer();
    }

    /**
     * Provision new workers for a client.
     */
    static async provisionWorker(clientId: string, count: number = 1) {
        let arrayToProvision: any[] = [];
        let remainingCount = count;

        while (remainingCount > 0) {
            if (mongoose.connection.readyState !== 1) {
                throw new Error('Database is not connected. Cannot start transaction session.');
            }
            const session = await mongoose.startSession();
            try {
                await session.withTransaction(async () => {
                    // Lock client row to prevent concurrent over-provisioning
                    const client = await WorkerRepo.getClientForUpdate(clientId, session);
                    if (!client) throw new Error(`Client ${clientId} not found`);

                    if (client.used_workers >= client.plan_max_workers) {
                        // Prevent infinite loop if capacity completely exhausted mid-loop
                        remainingCount = 0;
                        throw new Error('Plan limit reached');
                    }

                    // Lock server row
                    const server = await WorkerRepo.findAvailableServerForUpdate(session);
                    if (!server) {
                        remainingCount = 0;
                        throw new Error('No available capacity on any servers');
                    }

                    const availableCapacity = server.max_workers - server.active_workers;
                    const toAllocate = Math.min(remainingCount, availableCapacity);

                    if (toAllocate <= 0) {
                        remainingCount = 0;
                        throw new Error('Selected server indicates no available capacity');
                    }

                    // Atomically increment counters
                    await WorkerRepo.lockCapacity(clientId, server.server_id, toAllocate, session);

                    // Create the worker record
                    const newWorkerRecord = await WorkerRepo.createPendingWorker(clientId, server.server_id, toAllocate, session);
                    if (!newWorkerRecord) throw new Error('Failed to create worker record');
                    
                    arrayToProvision.push(newWorkerRecord);
                    remainingCount -= toAllocate;
                });
            } catch (error) {
                console.error(`[WorkerService] loop stopped allocating: ${error}`);
                break; // exit loop safely if no capacity or plan limit hit
            } finally {
                await session.endSession();
            }
        }

        // Phase 2: Deploy on Coolify OUTSIDE the transaction
        for (const worker of arrayToProvision) {
            try {
                await CommandDispatcher.dispatchStartWorker(worker.server_id, worker.worker_id, clientId, worker.workers_count);
            } catch (err: any) {
                console.error(
                    `[WorkerService] Coolify deploy failed for worker ${worker.worker_id}. Rolling back.`
                );
                await WorkerService.updateWorkerStatus(worker.worker_id, 'failed');
            }
        }

        return arrayToProvision;
    }

    /**
     * Decommission a worker.
     */
    static async decommissionWorker(workerId: string, apps?: any[]) {
        if (mongoose.connection.readyState !== 1) {
            throw new Error('Database is not connected. Cannot start transaction session.');
        }
        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
                const worker = await WorkerRepo.getWorker(workerId);

                if (!worker) throw new Error('Worker not found');
                if (worker.status === 'stopped') return;

                // 1. Update status
                await WorkerRepo.setWorkerStopping(workerId, session);

                // 2. Dispatch Stop
                await CommandDispatcher.dispatchStopWorker(
                    worker.server_id,
                    workerId,
                    worker.client_id,
                    false,
                    apps
                );
            });
        } finally {
            await session.endSession();
        }
    }

    /**
     * Update worker status.
     */
    static async updateWorkerStatus(workerId: string, status: string) {
        if (mongoose.connection.readyState !== 1) {
            throw new Error('Database is not connected. Cannot start transaction session.');
        }
        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
                const currentWorker = await WorkerRepo.getWorker(workerId);

                if (!currentWorker) return;

                // Update status
                await WorkerRepo.updateWorkerStatus(workerId, status, session);

                // If transitioning to terminal state, release resources
                if (
                    ['stopped', 'failed'].includes(status) &&
                    !['stopped', 'failed'].includes(currentWorker.status)
                ) {
                    await WorkerRepo.releaseResources(
                        currentWorker.client_id,
                        currentWorker.server_id,
                        currentWorker.workers_count,
                        session
                    );
                    console.log(`[WorkerService] Released resources for worker ${workerId}`);
                }
            });
        } finally {
            await session.endSession();
        }

        console.log(`✅ Worker ${workerId} status updated to ${status}`);
    }

    /**
     * Reap stale terminated workers from the DB.
     */
    static async reapStaleWorkers(kyrazoApps: any[] = [], ttlMs: number = 60 * 60 * 1000) {
        const staleWorkers = await WorkerRepo.findStaleTerminatedWorkers(ttlMs);

        if (staleWorkers.length === 0) return;

        console.log(`[WorkerService] Reaping ${staleWorkers.length} stale terminated worker(s)...`);

        for (const w of staleWorkers) {
            try {
                await CommandDispatcher.dispatchStopWorker('', w.worker_id, '', true, kyrazoApps);
            } catch (err: any) {
                console.warn(
                    `[WorkerService] Failed to delete Coolify app for stale worker ${w.worker_id}:`,
                    err
                );
            }

            try {
                await WorkerRepo.deleteWorker(w.worker_id);
                console.log(`[WorkerService] Reaped stale worker ${w.worker_id}`);
            } catch (err: any) {
                console.error(
                    `[WorkerService] Failed to delete DB record for worker ${w.worker_id}:`,
                    err
                );
            }
        }
    }

    static async reconcileServerCounts() {
        await WorkerRepo.reconcileServerCounts();
    }

    static async reconcileClientCounts() {
        await WorkerRepo.reconcileClientCounts();
    }
}
