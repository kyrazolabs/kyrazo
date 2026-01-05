import { IPagination, ISource } from '@kyrazo/shared';

export interface CreateSourceResponse {
    success: true;
    message?: string;
    data?: {
        sourceId: unknown;
        ingress: string;
    };
}

export interface DeleteSourceResponse {
    success: true;
    message?: string;
}

export interface GetSourceResponse {
    success: true;
    message?: string;
    data?: ISource;
}

export interface GetSourcesResponse {
    success: true;
    message?: string;
    pagination: IPagination;
    data?: Array<ISource>;
}

export interface UpdateSourceResponse {
    success: true;
    message?: string;
    data?: {
        source: ISource;
    };
}
