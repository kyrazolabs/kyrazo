import type { ISource } from '@kyrazo/shared';

export interface CreateSourceResponse {
    success: boolean;
    message: string;
    data: {
        sourceId: string;
        source: ISource;
    };
}

export interface GetSourcesResponse {
    success: boolean;
    message?: string;
    total: number;
    sources: ISource[];
}

export interface GetSourceResponse {
    success: boolean;
    message: string;
    data: ISource;
}

export interface UpdateSourceResponse {
    success: boolean;
    message: string;
    data: ISource;
}

export interface DeleteSourceResponse {
    success: boolean;
    message: string;
    data?: boolean;
}
