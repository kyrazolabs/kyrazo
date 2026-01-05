import { Target, type ITarget } from "@kyrazo/shared";

export class TargetRepository {
    async getTargetsByWorkspaceIdAndProjectIdAndTargetIds(
        workspaceId: string,
        projectId: string,
        targetIds: string[],
    ): Promise<ITarget[]> {
        return await Target.findActiveByWorkspaceAndProjectAndTargetIds(
            workspaceId,
            projectId,
            targetIds,
        );
    }

    async getTargetById(
        targetId: string,
        workspaceId: string,
        projectId: string,
    ): Promise<ITarget | null> {
        return await Target.findActiveByWorkspaceAndProjectAndTargetId(
            workspaceId,
            projectId,
            targetId,
        );
    }
}

export const targetRepository = new TargetRepository();
