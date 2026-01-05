import type { IPagination, ITarget } from '@kyrazo/shared';

export interface CreateTargetResponse {
    success: boolean;
    message: string;
    data: ITarget;
}

export interface GetTargetsResponse {
    success: boolean;
    message: string;
    pagination: IPagination;
    data: ITarget[];
}

export interface GetTargetByIdResponse {
    success: boolean;
    message: string;
    data: ITarget;
}

export interface GetTargetSecretResponse {
    success: boolean;
    message: string;
    data: string;
}

export interface UpdateTargetResponse {
    success: boolean;
    message: string;
    data: ITarget;
}

export interface DeleteTargetResponse {
    success: boolean;
    message: string;
    data: boolean;
}
