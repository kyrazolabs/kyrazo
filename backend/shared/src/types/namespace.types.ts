import { Document, Model, Types } from 'mongoose';
import { IUser, IWorkspace } from '.';

// Namespace interface
export interface INamespace extends Document {
    id: string;
    name: string;
    description?: string;
    workspaceId: Types.ObjectId;
    createBy?: Types.ObjectId;
    isArchived: boolean;
    isDeleted: boolean;
    deletedAt?: Date;
    whiteLabelHeaders?: string;
    transformer?: Types.ObjectId;
    isManagedTransform?: boolean;

    // Virtual fields
    creator?: IUser;
    workspace?: IWorkspace;

    //instance methods
    softDelete(): Promise<INamespace>;
    restore(): Promise<INamespace>;
    archive(): Promise<INamespace>;
    unarchive(): Promise<INamespace>;
    updateSettings(settings: Record<string, any>): Promise<INamespace>;
    updateProgress(newProgress: number): Promise<INamespace>;
    isOverdue(): boolean;
}

export interface INamespaceModel extends Model<INamespace> {
    findByOwner(ownerId: string): Promise<INamespace[]>;
    findByWorkspace(workspaceId: string): Promise<INamespace[]>;
    findByWorkspaceAndNamespace(workspaceId: string, namespaceId: string): Promise<INamespace>;
    findPublic(): Promise<INamespace[]>;

    searchNamespaces(query: string, limit?: number): Promise<INamespace[]>;

    getNamespaceStats(): Promise<{
        totalNamespaces: number;
        activeNamespaces: number;
        completedNamespaces: number;
        archivedNamespaces: number;
        deletedNamespaces: number;
    }>;

    getStatusStats(): Promise<Record<string, number>>;

    getRecentNamespaces(days?: number): Promise<INamespace[]>;

    findOverdue(): Promise<INamespace[]>;

    permanentlyDelete(namespaceId: string): Promise<INamespace | null>;

    isUserOwner(userId: string, namespaceId: string): Promise<boolean>;
}

export interface CreateNamespaceResponse {
    success: true;
    message: string;
    data: {
        namespace: INamespace;
    };
}

export interface GetNamespaceResponse {
    success: true;
    message: string;
    data: INamespace;
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
