import { Document, Model, Types } from 'mongoose';
import { IUser, IWorkspace } from '.';

// Project interface
export interface IProject extends Document {
    id: string;
    name: string;
    description?: string;
    workspaceId: Types.ObjectId;
    createBy?: Types.ObjectId;
    isArchived: boolean;
    isDeleted: boolean;
    deletedAt?: Date;
    whiteLabelHeaderPrefix?: string;

    // Virtual fields
    creator?: IUser;
    workspace?: IWorkspace;

    //instance methods
    softDelete(): Promise<IProject>;
    restore(): Promise<IProject>;
    archive(): Promise<IProject>;
    unarchive(): Promise<IProject>;
    updateSettings(settings: Record<string, any>): Promise<IProject>;
    updateProgress(newProgress: number): Promise<IProject>;
    isOverdue(): boolean;
}

export interface IProjectModel extends Model<IProject> {
    findByOwner(ownerId: string): Promise<IProject[]>;
    findByWorkspace(workspaceId: string): Promise<IProject[]>;
    findByWorkspaceAndProject(workspaceId: string, projectId: string): Promise<IProject>;
    findPublic(): Promise<IProject[]>;

    searchProjects(query: string, limit?: number): Promise<IProject[]>;

    getProjectStats(): Promise<{
        totalProjects: number;
        activeProjects: number;
        completedProjects: number;
        archivedProjects: number;
        deletedProjects: number;
    }>;

    getStatusStats(): Promise<Record<string, number>>;

    getRecentProjects(days?: number): Promise<IProject[]>;

    findOverdue(): Promise<IProject[]>;

    permanentlyDelete(projectId: string): Promise<IProject | null>;

    isUserOwner(userId: string, projectId: string): Promise<boolean>;
}

export interface CreateProjectResponse {
    success: true;
    message: string;
    data: {
        project: IProject;
    };
}

export interface GetProjectResponse {
    success: true;
    message: string;
    data: IProject;
}

export interface GetProjectsResponse {
    success: true;
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
    data: IProject[];
}

export interface UpdateProjectResponse {
    success: true;
    message: string;
    data: IProject;
}

export interface DeleteProjectResponse {
    success: true;
    message: string;
}

export interface RestoreProjectResponse {
    success: true;
    message: string;
    data: IProject;
}
