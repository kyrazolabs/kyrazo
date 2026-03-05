import { Target, type ITarget } from '@kyrazo/shared';

export class TargetRepository {
    async getTargetsByWorkspaceIdAndNamespaceIdAndTargetIds(
        workspaceId: string,
        namespaceId: string,
        targetIds: string[]
    ): Promise<ITarget[]> {
        return await Target.findActiveByWorkspaceAndNamespaceAndTargetIds(
            workspaceId,
            namespaceId,
            targetIds
        );
    }

    async getTargetById(
        targetId: string,
        workspaceId: string,
        namespaceId: string
    ): Promise<ITarget | null> {
        return await Target.findActiveByWorkspaceAndNamespaceAndTargetId(
            workspaceId,
            namespaceId,
            targetId
        );
    }
}

export const targetRepository = new TargetRepository();
