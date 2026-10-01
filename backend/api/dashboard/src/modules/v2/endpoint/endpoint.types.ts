import { IEndpoint } from '@kyrazo/shared';

export interface IEndpointResponse extends Omit<
    IEndpoint<''>,
    'workspaceId' | 'namespaceId' | 'userId' | 'secrets'
> {
    workspaceId: string;
    namespaceId: string;
    transformer?: string;
    isManagedTransform: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateEndpointResponse {
    success: boolean;
    message: string;
    data: IEndpointResponse;
}

export interface UpdateEndpointResponse {
    success: boolean;
    message: string;
    data: IEndpointResponse;
}

export interface GetEndpointResponse {
    success: boolean;
    message: string;
    data: IEndpointResponse;
}

export interface GetEndpointsResponse {
    success: boolean;
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
    data: IEndpointResponse[];
}

export interface DeleteEndpointResponse {
    success: boolean;
    message: string;
}
