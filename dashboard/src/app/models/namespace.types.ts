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
}

// Namespace Request Types
export interface CreateNamespaceRequest {
    name: string;
    description?: string;
    whiteLabelHeaders?: string;
}

export interface UpdateNamespaceRequest {
    name?: string;
    description?: string;
    whiteLabelHeaders?: string;
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
