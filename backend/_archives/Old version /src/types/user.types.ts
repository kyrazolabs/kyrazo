import { Document, Types } from 'mongoose';
import { BaseDocument } from './index';
import { IWorkspace } from './workspace.types';

export interface IUser {
  _id: string;
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
  emailVerificationToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserWorkspace extends BaseDocument {
  userId: Types.ObjectId;
  workspaceId: Types.ObjectId;
  role: WorkspaceRole;
  joinedAt: Date;
  invitedBy?: Types.ObjectId;
  invitationAcceptedAt?: Date;

  // Populated fields
  user?: IUser;
  workspace?: IWorkspace; // Will be defined in workspace types
}

// User roles in workspaces
export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';



export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
  updateLastLogin(): Promise<void>;
  deactivate(): Promise<void>;
  activate(): Promise<void>;
  updateProfile(updates: Partial<IUser>): Promise<IUser>;
}

export interface IUserModel extends Document, IUser, IUserMethods {}

export interface IUserStatics {
  findByEmail(email: string): Promise<IUserModel | null>;
  findActiveUsers(): Promise<IUserModel[]>;
  searchUsers(query: string, limit?: number): Promise<IUserModel[]>;
  getUserStats(): Promise<any>;
  getRecentUsers(days?: number): Promise<IUserModel[]>;
}


export interface INotificationPreferences {
  emailFrequency: string;
  quietHours: string;
}

export interface INotification {
  webhookFailures: boolean;
  dailySummary: boolean;
  securityAlerts: boolean;
  weeklyReports: boolean;
  preferences: INotificationPreferences;
}

export interface IUserPreference {
  userId: Types.ObjectId;
  notification: INotification;
}
