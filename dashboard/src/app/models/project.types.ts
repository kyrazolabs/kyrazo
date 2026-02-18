// Project Interface
export interface IProject {
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

// Project Request Types
export interface CreateProjectRequest {
    name: string;
    description?: string;
    whiteLabelHeaders?: string;
}

export interface UpdateProjectRequest {
    name?: string;
    description?: string;
    whiteLabelHeaders?: string;
}

// Project Response Types
export interface CreateProjectResponse {
    success: true;
    message: string;
    data: {
        project: IProject;
    };
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

export interface GetProjectResponse {
    success: true;
    message: string;
    data: IProject;
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
