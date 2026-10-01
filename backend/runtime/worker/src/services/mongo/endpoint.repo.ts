import { Endpoint, unprefixId, type IEndpoint } from '@kyrazo/shared';

export class EndpointRepository {
    async getEndpointsByWorkspaceIdAndNamespaceIdAndEndpointIds(
        workspaceId: string,
        namespaceId: string,
        endpointIds: string[]
    ): Promise<IEndpoint[]> {
        return await Endpoint.findActiveByWorkspaceAndNamespaceAndIds(
            unprefixId(workspaceId)!,
            unprefixId(namespaceId)!,
            endpointIds.map(id => unprefixId(id)).filter((id): id is string => !!id)
        );
    }

    async getEndpointById(
        endpointId: string,
        workspaceId: string,
        namespaceId: string
    ): Promise<IEndpoint | null> {
        return await Endpoint.findActiveByWorkspaceAndNamespaceAndId(
            unprefixId(workspaceId)!,
            unprefixId(namespaceId)!,
            unprefixId(endpointId)!
        );
    }
}

export const endpointRepository = new EndpointRepository();
