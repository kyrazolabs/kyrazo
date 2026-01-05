import { Target, type ITarget } from '@kyrazo/shared';

export class TargetRepository {
    async getTargetsByWorkspaceIdAndProjectIdAndTargetIds(
        workspaceId: string,
        projectId: string,
        targetIds: string[]
    ): Promise<ITarget[]> {
        return await Target.findActiveByWorkspaceAndProjectAndTargetIds(
            workspaceId,
            projectId,
            targetIds
        );
    }
}

export const targetRepository = new TargetRepository();
