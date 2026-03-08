import { postgresConfig, workers, servers, eq, and } from '@kyrazo/shared';

export class WorkerRepository {
    private get db() {
        return postgresConfig.getDrizzle();
    }

    async findByClientId(clientId: string) {
        return await this.db
            .select({
                worker_id: workers.worker_id,
                status: workers.status,
                created_at: workers.created_at,
                updated_at: workers.updated_at,
                server_ip: servers.ipv4,
                server_ipv6: servers.ipv6,
            })
            .from(workers)
            .innerJoin(servers, eq(workers.server_id, servers.server_id))
            .where(and(eq(workers.client_id, clientId), eq(workers.status, 'running')));
    }

    async findAllByClientId(clientId: string) {
        return await this.db
            .select({
                worker_id: workers.worker_id,
                status: workers.status,
                created_at: workers.created_at,
                updated_at: workers.updated_at,
                server_ip: servers.ipv4,
                server_ipv6: servers.ipv6,
            })
            .from(workers)
            .innerJoin(servers, eq(workers.server_id, servers.server_id))
            .where(eq(workers.client_id, clientId));
    }
}

export const workerRepository = new WorkerRepository();
