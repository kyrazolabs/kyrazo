import { connectDB, OrchestratorWorker, WorkerStatus } from '@/db';
import mongoose from 'mongoose';
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
     * Provision a new worker for a client.
     */
    static async provisionWorker(clientId: string) {
        const session = await mongoose.startSession();
        let newWorkerRecord: any;
        let serverId: string;

        try {
            await session.withTransaction(async () => {
                // Lock client row to prevent concurrent over-provisioning
                const client = await WorkerRepo.getClientForUpdate(clientId, session);
                if (!client) throw new Error(`Client ${clientId} not found`);

                if (client.used_workers >= client.plan_max_workers) {
                    throw new Error('Plan limit reached');
                }

                // Lock server row
                const server = await WorkerRepo.findAvailableServerForUpdate(session);
                if (!server) throw new Error('No available capacity');

                // Atomically increment counters
                await WorkerRepo.lockCapacity(clientId, server.server_id, session);

                // Create the worker record
                newWorkerRecord = await WorkerRepo.createPendingWorker(clientId, server.server_id, session);
                if (!newWorkerRecord) throw new Error('Failed to create worker record');
                serverId = server.server_id;
            });
        } finally {
            await session.endSession();
        }

        // Phase 2: Deploy on Coolify OUTSIDE the transaction
        try {
            await CommandDispatcher.dispatchStartWorker(serverId!, newWorkerRecord.worker_id, clientId);
        } catch (err: any) {
            console.error(
                `[WorkerService] Coolify deploy failed for worker ${newWorkerRecord.worker_id}. Rolling back.`
            );
            await WorkerService.updateWorkerStatus(newWorkerRecord.worker_id, 'failed');
            throw err;
        }

        return newWorkerRecord;
    }

    /**
     * Decommission a worker.
     */
    static async decommissionWorker(workerId: string, apps?: any[]) {
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
