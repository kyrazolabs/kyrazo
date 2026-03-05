import { Endpoint, type IEndpoint } from '@kyrazo/shared';

export class EndpointRepository {
    async getEndpointsByWorkspaceIdAndNamespaceIdAndEndpointIds(
        workspaceId: string,
        namespaceId: string,
        endpointIds: string[]
    ): Promise<IEndpoint[]> {
        return await Endpoint.findActiveByWorkspaceAndNamespaceAndIds(
            workspaceId,
            namespaceId,
            endpointIds
        );
    }

    async getEndpointById(
        endpointId: string,
        workspaceId: string,
        namespaceId: string
    ): Promise<IEndpoint | null> {
        return await Endpoint.findActiveByWorkspaceAndNamespaceAndId(
            workspaceId,
            namespaceId,
            endpointId
        );
    }
}

export const endpointRepository = new EndpointRepository();
