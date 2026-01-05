import { Types, Model } from 'mongoose';
import { IUser } from './user.types';
import { BaseDocument } from '.';
import { IUserWorkspace, WorkspaceRole } from './user.types';

export interface IWorkspace extends BaseDocument {
    name: string;
    description?: string;
    avatar?: string;
    ownerId: Types.ObjectId;
    isDeleted: boolean;
    deletedAt?: Date;
    isArchived?: boolean;

    // Settings
    // settings?: {

    // };

    // Virtual fields
    owner?: IUser;
    users?: IUserWorkspace[];
    app?: any[]; // Will be defined in project types

    // Instance methods
    archive: () => Promise<IWorkspace>;
    unarchive: () => Promise<IWorkspace>;
    softDelete: () => Promise<IWorkspace>;
    restore: () => Promise<IWorkspace>;
    updateSettings: (settings: any) => Promise<IWorkspace>;
}

export interface IWorkspaceModel extends Model<IWorkspace> {
    findByOwner(ownerId: string): Promise<IWorkspace[]>;
    searchWorkspaces(query: string, limit: number): Promise<IWorkspace[]>;
    getWorkspaceStats(): Promise<{
        totalWorkspaces: number;
        activeWorkspaces: number;
        deletedWorkspaces: number;
        archivedWorkspaces: number;
    }>;
    getRecentWorkspaces(days: number): Promise<IWorkspace[]>;
    findDeleted(): Promise<IWorkspace[]>;
    findArchived(): Promise<IWorkspace[]>;
    permanentlyDelete(workspaceId: string): Promise<void>;
}

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export interface IWorkspaceInvitation extends BaseDocument {
    workspaceId: Types.ObjectId;
    invitedBy: Types.ObjectId;
    inviteeEmail: string;
    inviteeUserId?: Types.ObjectId;
    role: WorkspaceRole;
    status: InvitationStatus;
    token: string;
    message?: string;
    expiresAt: Date;
    acceptedAt?: Date;
    declinedAt?: Date;

    // Virtual fields
    workspace?: IWorkspace;
    inviter?: IUser;
    invitee?: IUser;
    isExpired: boolean;
    isPending: boolean;
    canAccept: boolean;
    canDecline: boolean;

    // Instance methods
    accept(userId?: string): Promise<IWorkspaceInvitation>;
    decline(): Promise<IWorkspaceInvitation>;
    expire(): Promise<IWorkspaceInvitation>;
    extendExpiry(days: number): Promise<IWorkspaceInvitation>;
    resend(newToken?: string): Promise<IWorkspaceInvitation>;
}

export interface IWorkspaceInvitationModel extends Model<IWorkspaceInvitation> {
    // Static methods
    findByToken(token: string): Promise<IWorkspaceInvitation | null>;
    findByWorkspace(workspaceId: string): Promise<IWorkspaceInvitation[]>;
    findByEmail(email: string): Promise<IWorkspaceInvitation[]>;
    findPending(workspaceId?: string): Promise<IWorkspaceInvitation[]>;
    findExpired(workspaceId?: string): Promise<IWorkspaceInvitation[]>;
    findAccepted(workspaceId?: string): Promise<IWorkspaceInvitation[]>;
    findDeclined(workspaceId?: string): Promise<IWorkspaceInvitation[]>;
    findByUser(userId: string): Promise<IWorkspaceInvitation[]>;
    hasPendingInvitation(workspaceId: string, email: string): Promise<boolean>;
    getInvitationStats(workspaceId?: string): Promise<{
        total: number;
        pending: number;
        accepted: number;
        declined: number;
        expired: number;
    }>;
    cleanupExpired(): Promise<any>;
    createInvitation(
        workspaceId: string,
        invitedBy: string,
        inviteeEmail: string,
        role: WorkspaceRole,
        message?: string,
        expiresInDays?: number
    ): Promise<IWorkspaceInvitation>;
    generateToken(): string;
}

export interface CreateWorkspaceResponse {
    success: true;
    message?: string;
    data?: IWorkspace;
}

export interface UpdateWorkspaceResponse {
    success: true;
    message?: string;
    data?: IWorkspace;
}

export interface GetWorkspaceResponse {
    success: true;
    message?: string;
    data?: IWorkspace;
}

export interface GetUserWorkspacesResponse {
    success: true;
    message?: string;
    data?: IUserWorkspace[];
}

export interface GetWorkspaceMembersResponse {
    success: true;
    message?: string;
    data?: IUserWorkspace;
}

export interface WorkspaceActionResponse {
    success: true;
    message?: string;
}
