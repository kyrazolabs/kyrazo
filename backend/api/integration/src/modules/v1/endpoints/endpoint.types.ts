import type { IEndpoint } from '@kyrazo/shared';

export interface CreateEndpointResponse {
    success: boolean;
    message: string;
    data: {
        endpoint: IEndpoint;
    };
}

export interface GetEndpointsResponse {
    success: boolean;
    message?: string;
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
    data: IEndpoint[];
}

export interface GetEndpointResponse {
    success: boolean;
    message: string;
    data: IEndpoint;
}

export interface UpdateEndpointResponse {
    success: boolean;
    message: string;
    data: IEndpoint;
}

export interface DeleteEndpointResponse {
    success: boolean;
    message: string;
    data?: boolean;
}

export interface GetEndpointSecretResponse {
    success: boolean;
    message: string;
    data: string;
}

export interface GetEndpointByIdResponse extends GetEndpointResponse {}
