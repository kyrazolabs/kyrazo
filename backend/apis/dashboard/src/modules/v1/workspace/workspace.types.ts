import { IWorkspace, IUserWorkspace, IPagination } from '@kyrazo/shared';

export interface CreateWorkspaceResponse {
    success: boolean;
    message: string;
    data: IWorkspace;
}

export interface GetWorkspacesResponse {
    success: boolean;
    message: string;
    data: IUserWorkspace[];
}

export interface GetWorkspaceResponse {
    success: boolean;
    message: string;
    data: IWorkspace;
}

export interface UpdateWorkspaceResponse {
    success: boolean;
    message: string;
    data: IWorkspace;
}

export interface WorkspaceActionResponse {
    success: boolean;
    message: string;
}

export interface GetWorkspaceMembersResponse {
    success: boolean;
    message: string;
    data: IUserWorkspace[];
}
