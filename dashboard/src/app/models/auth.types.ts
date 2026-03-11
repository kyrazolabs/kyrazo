export interface IUser {
    _id: string;
    id: string;
    workspaceId?: string;
    firstName: string;
    lastName: string;
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
    lastLogin: string;
    createdAt: string;
    updatedAt: string;
    is2FAEnabled: boolean;
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
    pending_2fa?: boolean;
    method?: 'app' | 'email';
    temp_token?: string;
    data?: {
        user: IUser;
        tokens: {
            access: string;
            refresh: string;
        };
    };
}

export interface RefreshTokenResponse {
    tokens: {
        access: string;
        refresh: string;
    };
}

export type RegisterResponse = LoginResponse;

export type Login2FARequest = {
    code: string;
    tempToken: string;
};

export type Setup2FARequest = {
    method: 'app' | 'email';
};

export type Setup2FAResponse = {
    success: boolean;
    message: string;
    data: {
        secret?: string;
        qrCode?: string;
        method: 'app' | 'email';
    };
};

export type Verify2FASetupRequest = {
    method: 'app' | 'email';
    code: string;
};

export type SensitiveAction =
    | 'update_profile'
    | 'delete_workspace'
    | 'update_workspace'
    | 'delete_namespace'
    | 'update_namespace'
    | 'manage_keys';

export type RequestSensitiveOTPRequest = {
    action: SensitiveAction;
};

export type VerifySensitiveOTPRequest = {
    action: SensitiveAction;
    code: string;
};

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
