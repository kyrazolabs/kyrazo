import { OrchestratorServer, ServerStatus } from '@kyrazo/shared';

export async function findAvailableServer() {
    return await OrchestratorServer.findOne({
        status: ServerStatus.ACTIVE,
        $expr: { $lt: ['$active_workers', '$max_workers'] },
    }).sort({ active_workers: 1 }); // Or sort by available capacity if needed
}
