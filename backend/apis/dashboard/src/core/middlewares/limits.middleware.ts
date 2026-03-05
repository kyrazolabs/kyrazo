import { MiddlewareHandler } from 'hono';
import { IErrorResponse, IPlanLimits, Project, unprefixId } from '@kyrazo/shared';
import { AppContext } from './auth.middleware';
import { limitService } from '@/shared/services/limit.service';
import { workspaceRepository } from '@/modules/v1/workspace/workspace.repo';

export const checkWorkspaceLimits = (limitKey: keyof IPlanLimits): MiddlewareHandler => {
    return async (c: AppContext, next) => {
        const workspaceId = c.workspace?.workspaceId;

        // If no workspaceId, we use FREE_PLAN_LIMITS as per user request
        const limits = await limitService.getWorkspaceLimits(unprefixId(workspaceId?.toString()));
        const limit = limits[limitKey];

        if (limit === -1) {
            return await next();
        }

        let currentCount = 0;

        if (limitKey === 'maxProjects') {
            if (!workspaceId) {
                // If no workspace, technically we can't create projects that require workspaceId
                // But for safety, let's assume 0 if it's not present yet
                currentCount = 0;
            } else {
                currentCount = await Project.countDocuments({
                    workspaceId: unprefixId(workspaceId.toString()),
                    isDeleted: false,
                });
            }
        } else if (limitKey === 'maxMembers') {
            if (!workspaceId) {
                currentCount = 0;
            } else {
                const membersCount = await workspaceRepository.countMembers(workspaceId.toString());
                const pendingInvitations = await workspaceRepository.countPendingInvitations(
                    workspaceId.toString()
                );
                currentCount = membersCount + pendingInvitations;
            }
        }

        if (currentCount >= limit) {
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'LIMIT_EXCEEDED',
                        message: `${limitKey} limit exceeded for your workspace.`,
                        requestId: c.get('requestId'),
                    },
                },
                403
            );
        }

        await next();
    };
};
