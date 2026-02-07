// Workspace Role Enum
export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';

// Workspace Interface
export interface IWorkspace {
    id: string;
    name: string;
    description?: string | null;
    ownerId: string;
    isDeleted: boolean;
    deletedAt?: Date;
    isArchived: boolean;
    archivedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

// Workspace Member Interface
export interface IWorkspaceMember {
    id: string;
    userId: string;
    workspaceId: string;
    role: WorkspaceRole;
    invitedBy: string;
    invitationAcceptedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    user?: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
        avatar?: string;
    };
}

// Request Payload Types
export interface CreateWorkspaceRequest {
    name: string;
    description?: string | null;
}

export interface UpdateWorkspaceRequest {
    name?: string;
    description?: string | null;
}

export interface InviteWorkspaceMemberRequest {
    email: string;
    message?: string;
    role: WorkspaceRole;
}

export interface UpdateWorkspaceMemberRoleRequest {
    userId: string;
    role: WorkspaceRole;
}

export interface GetWorkspaceByIdRequest {
    workspaceId: string;
}

export interface UpdateInvitationStatusRequest {
    token: string;
}

export interface WorkspaceMemberRequest {
    workspaceId: string;
    userId: string;
}

// Workspace Membership Interface (what the API actually returns)
export interface IWorkspaceMembership {
    _id: string;
    userId: string;
    workspaceId: string;
    role: WorkspaceRole;
    invitedBy: string;
    invitationAcceptedAt?: Date;
    joinedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    workspace: IWorkspace;
    id: string;
}

// Response Types
export interface CreateWorkspaceResponse {
    success: true;
    message: string;
    data: IWorkspace;
}

export interface GetUserWorkspacesResponse {
    success: true;
    message: string;
    data: IWorkspaceMembership[];
}

export interface GetWorkspaceResponse {
    success: true;
    message: string;
    data: IWorkspace;
}

export interface UpdateWorkspaceResponse {
    success: true;
    message: string;
    data: IWorkspace;
}

export interface WorkspaceActionResponse {
    success: true;
    message: string;
}

export interface GetWorkspaceMembersResponse {
    success: true;
    message: string;
    data: IWorkspaceMember[];
}
