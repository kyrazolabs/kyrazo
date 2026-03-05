import { Model, Types } from 'mongoose';
import { IUser } from './user.types';

export interface AuthResponse {
    success: true;
    message?: string;
    pending_2fa?: boolean;
    method?: 'email' | 'app';
    temp_token?: string;
    data: {
        user: Omit<IUser, 'passwordHash'>;
        tokens?: {
            access: string;
            refresh: string;
        };
    };
}

export interface Verify2FAInput {
    code: string;
    tempToken: string;
}

export interface Setup2FAResponse {
    success: true;
    message?: string;
    data: {
        secret: string;
        qrCode?: string;
        backupCodes: string[];
    };
}

export interface OTPActionRequest {
    action: 'update_profile' | 'delete_workspace' | 'delete_namespace' | 'manage_keys';
}
export type AuthRefreshResponse = Omit<AuthResponse, 'data'> & {
    data: {
        tokens: {
            access: string;
            refresh: string;
        };
    };
};

export interface AuthActionsResponse {
    success: true;
    message?: string;
}

export interface ProfileActionsResponse {
    success: true;
    message?: string;
    data: IUser;
}

export interface IRefreshToken extends Omit<Document, 'createdAt'> {
    userId: Types.ObjectId;
    token: string;
    expiresAt: Date;
    createdAt?: Date;
    ipAddress?: string;
    userAgent?: string;
    isRevoked?: boolean;
    usedAt?: Date;

    // Instance Methods
    revokeToken: () => Promise<IRefreshToken>;
}

export interface IRefreshTokenModel extends Model<IRefreshToken> {
    findByToken(email: string): Promise<IRefreshToken | null>;
    revokeToken(token: string): Promise<IRefreshToken>;
    revokeAllUserTokens(userId: string): Promise<IRefreshToken[]>;
}
