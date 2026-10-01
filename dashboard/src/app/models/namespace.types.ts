import { ITransform } from './transform.types';

// Namespace Interface
export interface INamespace {
    id: string;
    name: string;
    description?: string;
    workspaceId: string;
    createBy: string;
    isDeleted: boolean;
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    whiteLabelHeaders?: string;
    transformer?: ITransform;
    isManagedTransform?: boolean;
}

export interface NamespaceTransformerData {
    name?: string;
    description?: string;
    code: string;
}

// Namespace Request Types
export interface CreateNamespaceRequest {
    name: string;
    description?: string;
    whiteLabelHeaders?: string;
    transformer?: NamespaceTransformerData;
}

export interface UpdateNamespaceRequest {
    name?: string;
    description?: string;
    whiteLabelHeaders?: string;
    transformer?: NamespaceTransformerData | null;
}

// Namespace Response Types
export interface CreateNamespaceResponse {
    success: true;
    message: string;
    data: {
        namespace: INamespace;
    };
}

export interface GetNamespacesResponse {
    success: true;
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
    data: INamespace[];
}

export interface GetNamespaceResponse {
    success: true;
    message: string;
    data: INamespace;
}

export interface UpdateNamespaceResponse {
    success: true;
    message: string;
    data: INamespace;
}

export interface DeleteNamespaceResponse {
    success: true;
    message: string;
}

export interface RestoreNamespaceResponse {
    success: true;
    message: string;
    data: INamespace;
}
