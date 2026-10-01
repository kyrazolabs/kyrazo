import { OrchestratorWorker, OrchestratorServer } from '@kyrazo/shared';

export class WorkerRepository {
    async findByClientId(clientId: string) {
        // Fetch running workers
        const workers = await OrchestratorWorker.find({
            client_id: clientId,
            status: 'running',
        }).lean();

        if (workers.length === 0) return [];

        // Join with servers to get IP info
        const serverIds = [...new Set(workers.map(w => w.server_id))];
        const servers = await OrchestratorServer.find({
            server_id: { $in: serverIds },
        }).lean();

        const serverMap = new Map(servers.map(s => [s.server_id, s]));

        return workers.map(w => {
            const server = serverMap.get(w.server_id);
            return {
                worker_id: w.worker_id,
                status: w.status,
                created_at: w.created_at,
                updated_at: w.updated_at,
                server_ip: server?.ipv4,
                server_ipv6: server?.ipv6,
            };
        });
    }

    async findAllByClientId(clientId: string) {
        const workers = await OrchestratorWorker.find({
            client_id: clientId,
        }).lean();

        if (workers.length === 0) return [];

        const serverIds = [...new Set(workers.map(w => w.server_id))];
        const servers = await OrchestratorServer.find({
            server_id: { $in: serverIds },
        }).lean();

        const serverMap = new Map(servers.map(s => [s.server_id, s]));

        return workers.map(w => {
            const server = serverMap.get(w.server_id);
            return {
                worker_id: w.worker_id,
                status: w.status,
                created_at: w.created_at,
                updated_at: w.updated_at,
                server_ip: server?.ipv4,
                server_ipv6: server?.ipv6,
            };
        });
    }
}

export const workerRepository = new WorkerRepository();
