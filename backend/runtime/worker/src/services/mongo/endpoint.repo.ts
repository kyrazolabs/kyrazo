import { Endpoint, type IEndpoint } from "@kyrazo/shared";

export class EndpointRepository {
    async getEndpointsByWorkspaceIdAndProjectIdAndEndpointIds(
        workspaceId: string,
        projectId: string,
        endpointIds: string[],
    ): Promise<IEndpoint[]> {
        return await Endpoint.findActiveByWorkspaceAndProjectAndIds(
            workspaceId,
            projectId,
            endpointIds,
        );
    }

    async getEndpointById(
        endpointId: string,
        workspaceId: string,
        projectId: string,
    ): Promise<IEndpoint | null> {
        return await Endpoint.findActiveByWorkspaceAndProjectAndId(
            workspaceId,
            projectId,
            endpointId,
        );
    }
}

export const endpointRepository = new EndpointRepository();
