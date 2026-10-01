import { Model, Types } from 'mongoose';
import { IWorkspace } from './workspace.types';
import { BaseDocument } from '.';

export interface IUser extends BaseDocument {
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
    passwordHash: string;
    isActive: boolean;
    lastLogin?: Date;
    jobTitle: string;
    timeZone: string;
    language: string;
    emailVerified: boolean;
    googleId?: string;
    emailVerificationToken?: string;

    // Instance Methods
    comparePassword(candidatePassword: string): Promise<boolean>;
    updateLastLogin(): Promise<void>;
    deactivate(): Promise<void>;
    activate(): Promise<void>;
    updateProfile(updates: any): Promise<IUser>;
}
export interface IUserModel extends Model<IUser> {
    findByEmail(email: string): Promise<IUser | null>;
    findActiveUsers(): Promise<IUser[]>;
    searchUsers(query: string, limit?: number): Promise<IUser[]>;
    getUserStats(): Promise<any>;
    getRecentUsers(days?: number): Promise<IUser[]>;
}
export interface IUserWorkspace extends BaseDocument {
    userId: Types.ObjectId;
    workspaceId: Types.ObjectId;
    role: WorkspaceRole;
    joinedAt: Date;
    invitedBy?: Types.ObjectId;
    invitationAcceptedAt?: Date;
    isDeleted: boolean;
    deletedAt?: Date;

    // Populated fields
    user?: IUser;
    workspace?: IWorkspace; // Will be defined in workspace types

    // Instance methods
    acceptInvitation: () => Promise<IUserWorkspace>;
    isOwner: () => Promise<boolean>;
    isAdmin: () => Promise<boolean>;
    canManageUsers: () => Promise<boolean>;
    canManageSettings: () => Promise<boolean>;
}

// User roles in workspaces
export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface INotificationPreferences {
    emailFrequency: string;
    quietHours: string;
}

export interface INotification {
    sourceFailures: boolean;
    dailySummary: boolean;
    securityAlerts: boolean;
    weeklyReports: boolean;
    preferences: INotificationPreferences;
}

export interface IUserPreference {
    userId: Types.ObjectId;
    notification: INotification;
}

export interface UpdateProfileInput {
    firstName?: string;
    lastName?: string;
    jobTitle?: string;
    avatar?: string;
    timeZone?: string;
    language?: string;
}

export interface PreferencesActionsResponse {
    success: true;
    message?: string;
    data: IUserPreference;
}

// 2FA Types
export type TwoFAMethod = 'email' | 'app';

export interface IUser2FA extends BaseDocument {
    userId: Types.ObjectId;
    isEnabled: boolean;
    method: TwoFAMethod;
    secret: string;
    enabledAt?: Date;
    backupCodes: string[];

    // Instance methods
    enable(): Promise<void>;
    disable(): Promise<void>;
    updateSecret(newSecret: string): Promise<void>;
    generateBackupCodes(): string[];
    useBackupCode(code: string): Promise<boolean>;
}

export interface IUser2FAModel extends Model<IUser2FA> {
    findByUserId(userId: string): Promise<IUser2FA | null>;
    findEnabledByUserId(userId: string): Promise<IUser2FA | null>;
    getEnabledCount(): Promise<number>;
    getMethodStats(): Promise<Record<TwoFAMethod, number>>;
}
