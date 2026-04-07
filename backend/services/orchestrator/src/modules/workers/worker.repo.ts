import { OrchestratorClient, OrchestratorServer, OrchestratorWorker, WorkerStatus } from '@/db';
import mongoose from 'mongoose';
import crypto from 'crypto';

export class WorkerRepo {
    /**
     * Find the best available server (least loaded) that has capacity.
     */
    static async findAvailableServer() {
        return await OrchestratorServer.findOne({
            status: 'active',
            $expr: { $lt: ['$active_workers', '$max_workers'] },
        }).sort({ active_workers: 1 });
    }

    /**
     * Find the best available server WITH a lock (using Mongoose transaction if needed, 
     * but usually findOneAndUpdate is enough for atomic increment).
     */
    static async findAvailableServerForUpdate(session?: mongoose.ClientSession) {
        // In Mongo, we can use a transaction or just atomic findOneAndUpdate if we lock later.
        // But the original code wanted a lock.
        return await OrchestratorServer.findOne({
            status: 'active',
            $expr: { $lt: ['$active_workers', '$max_workers'] },
        }).session(session || null).sort({ active_workers: 1 });
    }

    static async getClientForUpdate(clientId: string, session?: mongoose.ClientSession) {
        return await OrchestratorClient.findOne({ client_id: clientId }).session(session || null);
    }

    static async upsertClient(clientId: string, maxWorkers: number, session?: mongoose.ClientSession) {
        await OrchestratorClient.findOneAndUpdate(
            { client_id: clientId },
            { $set: { plan_max_workers: maxWorkers } },
            { upsert: true, new: true, session }
        );
    }

    /**
     * Atomically increment capacity counters for a client and server.
     */
    static async lockCapacity(clientId: string, serverId: string, workersCount: number = 1, session?: mongoose.ClientSession) {
        await OrchestratorClient.updateOne(
            { client_id: clientId },
            { $inc: { used_workers: workersCount } },
            { session }
        );

        await OrchestratorServer.updateOne(
            { server_id: serverId },
            { $inc: { active_workers: workersCount } },
            { session }
        );
    }

    static async createPendingWorker(clientId: string, serverId: string, workersCount: number = 1, session?: mongoose.ClientSession) {
        const [newWorker] = await OrchestratorWorker.create(
            [
                {
                    worker_id: crypto.randomUUID(), // Or let Mongo generate if you want, but original used UUID
                    client_id: clientId,
                    server_id: serverId,
                    workers_count: workersCount,
                    status: WorkerStatus.PENDING,
                },
            ],
            { session }
        );
        return newWorker;
    }

    static async getWorker(workerId: string) {
        return await OrchestratorWorker.findOne({ worker_id: workerId });
    }

    static async setWorkerStopping(workerId: string, session?: mongoose.ClientSession) {
        await OrchestratorWorker.updateOne(
            { worker_id: workerId },
            { $set: { status: WorkerStatus.STOPPING } },
            { session }
        );
    }

    static async updateWorkerStatus(workerId: string, status: string, session?: mongoose.ClientSession) {
        await OrchestratorWorker.updateOne(
            { worker_id: workerId },
            { $set: { status: status as any, updated_at: new Date() } },
            { session }
        );
    }

    /**
     * Release resources with a floor of 0 to prevent negative counter drift.
     */
    static async releaseResources(clientId: string, serverId: string, workersCount: number = 1, session?: mongoose.ClientSession) {
        await OrchestratorClient.updateOne(
            { client_id: clientId },
            { $inc: { used_workers: -workersCount } },
            { session }
        );
        // Ensure it doesn't go below 0 (Mongo doesn't have GREATEST in $inc directly easily without $cond/min/max)
        // But for Kyrazo's scale, simple $inc is usually okay, or use a filter
        await OrchestratorClient.updateOne(
            { client_id: clientId, used_workers: { $lt: 0 } },
            { $set: { used_workers: 0 } },
            { session }
        );

        await OrchestratorServer.updateOne(
            { server_id: serverId },
            { $inc: { active_workers: -workersCount } },
            { session }
        );
        await OrchestratorServer.updateOne(
            { server_id: serverId, active_workers: { $lt: 0 } },
            { $set: { active_workers: 0 } },
            { session }
        );
    }

    /**
     * Find stale terminated workers.
     */
    static async findStaleTerminatedWorkers(ttlMs: number = 60 * 60 * 1000) {
        const cutoff = new Date(Date.now() - ttlMs);
        return await OrchestratorWorker.find({
            status: { $in: [WorkerStatus.STOPPED, WorkerStatus.FAILED] },
            updated_at: { $lt: cutoff },
        }).lean();
    }

    /**
     * Delete a worker record from the DB.
     */
    static async deleteWorker(workerId: string, session?: mongoose.ClientSession) {
        await OrchestratorWorker.deleteOne({ worker_id: workerId }, { session });
    }

    /**
     * Reconcile server active_workers count from actual worker records.
     */
    static async reconcileServerCounts() {
        const servers = await OrchestratorServer.find({});
        for (const server of servers) {
            const result = await OrchestratorWorker.aggregate([
                { $match: { server_id: server.server_id, status: { $in: [WorkerStatus.PENDING, WorkerStatus.STARTING, WorkerStatus.RUNNING, WorkerStatus.STOPPING] } } },
                { $group: { _id: null, count: { $sum: '$workers_count' } } }
            ]);
            const count = result[0]?.count || 0;
            await OrchestratorServer.updateOne({ server_id: server.server_id }, { $set: { active_workers: count } });
        }
    }

    /**
     * Reconcile client used_workers count from actual worker records.
     */
    static async reconcileClientCounts() {
        const clients = await OrchestratorClient.find({});
        for (const client of clients) {
            const result = await OrchestratorWorker.aggregate([
                { $match: { client_id: client.client_id, status: { $in: [WorkerStatus.PENDING, WorkerStatus.STARTING, WorkerStatus.RUNNING, WorkerStatus.STOPPING] } } },
                { $group: { _id: null, count: { $sum: '$workers_count' } } }
            ]);
            const count = result[0]?.count || 0;
            await OrchestratorClient.updateOne({ client_id: client.client_id }, { $set: { used_workers: count } });
        }
    }
}
