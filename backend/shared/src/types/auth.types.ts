import { Model, Types } from "mongoose";
import { IUser } from "./user.types";

export interface AuthResponse {
  success: true;
  message?: string;
  data: {
    user: Omit<IUser, "passwordHash">;
    tokens: {
      access: string;
      refresh: string;
    };
  };
}
export type AuthRefreshResponse = Omit<AuthResponse, "data"> & {
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

export interface IRefreshToken extends Omit<Document, "createdAt"> {
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
