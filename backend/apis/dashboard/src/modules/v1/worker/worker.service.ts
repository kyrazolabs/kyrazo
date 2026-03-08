import { workerRepository } from './worker.repo';

export class WorkerService {
    async getWorkerStatus(workspaceId: string) {
        // In our system, clientId in postgres matches workspaceId (unprefixed)
        return await workerRepository.findByClientId(workspaceId);
    }

    async getAllWorkers(workspaceId: string) {
        return await workerRepository.findAllByClientId(workspaceId);
    }
}

export const workerService = new WorkerService();
