import { workerService } from './worker.service';
import { logger, unprefixId } from '@kyrazo/shared';
import { AppContext } from '@/core/middlewares/auth.middleware';

export class WorkerController {
    /**
     * @title getStatus
     * @description Fetch status for all workers in the current workspace.
     * @param c AppContext
     */
    async getStatus(c: AppContext) {
        try {
            // Workspace ID is attached to context by requireWorkspaceMembership middleware
            const workspaceId = c.workspace?.workspaceId;

            if (!workspaceId) {
                return c.json(
                    {
                        success: false,
                        error: {
                            code: 'WORKSPACE_ID_MISSING',
                            message: 'Workspace ID is required',
                            requestId: c.get('requestId'),
                        },
                    },
                    400
                );
            }

            const cleanWorkspaceId = unprefixId(workspaceId.toString())!;
            const workers = await workerService.getAllWorkers(cleanWorkspaceId);

            return c.json({
                success: true,
                data: workers,
            });
        } catch (error: any) {
            logger.error('Failed to fetch worker status', error);
            return c.json(
                {
                    success: false,
                    error: {
                        code: 'INTERNAL_ERROR',
                        message: 'Internal server error',
                        requestId: c.get('requestId'),
                    },
                },
                500
            );
        }
    }
}

export const workerController = new WorkerController();
