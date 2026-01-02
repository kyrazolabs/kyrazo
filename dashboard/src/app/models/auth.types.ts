export interface IUser {
  _id: string;
  id: string;
  workspaceId?: string;
  name: string;
  email: string;
  avatar: string | null;
  isActive: boolean;
  lastLogin: string; // ISO date string
  timeZone: string;
  language: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// User profile response
export interface UserProfileResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string;
  jobTitle: string;
  timeZone: string;
  language: string;
  isActive: boolean;
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  jobTitle?: string;
};

export type ForgetPasswordRequest = {
  email: string;
};
export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: IUser;
    tokens: {
      access: string;
      refresh: string;
    };
  };
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export type RegisterResponse = LoginResponse;

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
  userId: string;
  notification: INotification;
}

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export type VerifyEmailRequest = {
  token: string;
};

export type ResetPasswordRequest = {
  token: string;
  password: string;
};
